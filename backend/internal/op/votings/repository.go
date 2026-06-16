package votings

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type rowScanner interface {
	Scan(dest ...any) error
}

const votingSelectSQL = `
	SELECT
		v.id::text,
		v.public_id,
		v.cycle_id::text,
		p.public_id,
		t.slug,
		t.name,
		v.title,
		v.summary,
		v.deadline,
		v.quorum_needed,
		v.quorum_reached,
		v.votes_yes,
		v.votes_no,
		v.votes_abstain,
		v.status,
		v.created_at,
		v.updated_at
	FROM op_votings v
	JOIN budget_proposals p ON p.id = v.proposal_id
	JOIN territories t ON t.id = v.territory_id
`

func (r *Repository) actorByID(ctx context.Context, citizenID string) (actor, error) {
	var a actor
	var territoryID sql.NullString
	err := r.db.QueryRow(ctx, `
		SELECT id::text, full_name, role, territory_id::text
		FROM citizens
		WHERE id = $1::uuid
	`, citizenID).Scan(&a.ID, &a.Name, &a.Role, &territoryID)
	if err != nil {
		return actor{}, err
	}
	if territoryID.Valid {
		a.TerritoryID = territoryID.String
	}

	return a, nil
}

func (r *Repository) proposalRecord(ctx context.Context, identifier string) (proposalRecord, error) {
	var rec proposalRecord
	err := r.db.QueryRow(ctx, `
		SELECT
			p.id::text,
			p.public_id,
			p.cycle_id::text,
			oc.phase,
			p.territory_id::text,
			p.title,
			p.problem_summary,
			p.solution_scope,
			p.status
		FROM budget_proposals p
		JOIN op_cycles oc ON oc.id = p.cycle_id
		WHERE p.id::text = $1 OR p.public_id = $1
	`, identifier).Scan(
		&rec.ID,
		&rec.PublicID,
		&rec.CycleID,
		&rec.CyclePhase,
		&rec.TerritoryID,
		&rec.Title,
		&rec.ProblemSummary,
		&rec.SolutionScope,
		&rec.Status,
	)
	return rec, err
}

func (r *Repository) hasVotingAuthority(ctx context.Context, a actor, territoryID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM territory_maintainers
			WHERE citizen_id = $1::uuid
				AND status IN ('Provisório', 'Ativo', 'Em revisão')
				AND (term_end IS NULL OR term_end > NOW())
				AND (
					scope = 'geral'
					OR (scope = 'territorial' AND territory_id = $2::uuid)
				)
		)
	`, a.ID, territoryID).Scan(&exists)

	return exists, err
}

func (r *Repository) listVotings(ctx context.Context) ([]Voting, error) {
	rows, err := r.db.Query(ctx, votingSelectSQL+` ORDER BY v.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanVotingRows(rows)
}

func (r *Repository) listVotingsByTerritory(ctx context.Context, territoryID string) ([]Voting, error) {
	rows, err := r.db.Query(ctx, votingSelectSQL+`
		WHERE v.territory_id = (
			SELECT id FROM territories WHERE id::text = $1 OR slug = $1 OR name = $1
		)
		ORDER BY v.created_at DESC
	`, territoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanVotingRows(rows)
}

func (r *Repository) getVoting(ctx context.Context, identifier string) (Voting, error) {
	return scanVoting(r.db.QueryRow(ctx, votingSelectSQL+`
		WHERE v.id::text = $1 OR v.public_id = $1
	`, identifier))
}

func (r *Repository) openVoting(ctx context.Context, a actor, proposal proposalRecord) (Voting, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Voting{}, err
	}
	defer rollback(ctx, tx)

	publicID, err := nextVotingPublicID(ctx, tx)
	if err != nil {
		return Voting{}, err
	}

	var quorumNeeded int
	var deadline time.Time
	if err := tx.QueryRow(ctx, `
		SELECT
			GREATEST(
				1,
				CEIL(COUNT(c.id)::numeric * COALESCE(NULLIF(oc.regimento->>'votingQuorumPct', '')::numeric, 10) / 100.0)::int
			) AS quorum_needed,
			NOW() + make_interval(days => COALESCE(NULLIF(oc.regimento->>'votingWindow', '')::int, 7)) AS deadline
		FROM op_cycles oc
		LEFT JOIN citizens c ON c.territory_id = $1::uuid
		WHERE oc.id = $2::uuid
		GROUP BY oc.regimento
	`, proposal.TerritoryID, proposal.CycleID).Scan(&quorumNeeded, &deadline); err != nil {
		return Voting{}, err
	}

	summary := proposal.ProblemSummary
	if strings.TrimSpace(summary) == "" {
		summary = proposal.SolutionScope
	}

	var votingID string
	err = tx.QueryRow(ctx, `
		INSERT INTO op_votings (
			public_id,
			cycle_id,
			proposal_id,
			territory_id,
			title,
			summary,
			deadline,
			quorum_needed,
			created_by
		)
		VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9::uuid)
		RETURNING id::text
	`, publicID, proposal.CycleID, proposal.ID, proposal.TerritoryID, proposal.Title, summary, deadline, quorumNeeded, a.ID).Scan(&votingID)
	if err != nil {
		if isUniqueViolation(err) {
			return Voting{}, web.NewError(http.StatusConflict, "esta proposta já possui votação")
		}
		return Voting{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE budget_proposals
		SET status = 'Em votação'
		WHERE id = $1::uuid
	`, proposal.ID); err != nil {
		return Voting{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID:   a.ID,
		Name: a.Name,
		Role: a.Role,
		Type: auditActorType(a.Role),
	}, audit.Event{
		Action:         "op.voting.opened",
		EntityType:     "op_voting",
		EntityID:       votingID,
		EntityPublicID: publicID,
		Metadata: map[string]any{
			"proposalId":   proposal.PublicID,
			"territoryId":  proposal.TerritoryID,
			"quorumNeeded": quorumNeeded,
			"deadline":     deadline.UTC().Format(time.RFC3339),
		},
	}); err != nil {
		return Voting{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Voting{}, err
	}

	return r.getVoting(ctx, publicID)
}

func (r *Repository) castVote(ctx context.Context, a actor, identifier string, selection string) (voteResponse, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return voteResponse{}, err
	}
	defer rollback(ctx, tx)

	var votingID, publicID, status, territoryID string
	var deadline time.Time
	if err := tx.QueryRow(ctx, `
		SELECT id::text, public_id, status, deadline, territory_id::text
		FROM op_votings
		WHERE id::text = $1 OR public_id = $1
		FOR UPDATE
	`, identifier).Scan(&votingID, &publicID, &status, &deadline, &territoryID); err != nil {
		return voteResponse{}, err
	}

	if status != "Aberta" {
		return voteResponse{}, web.NewError(http.StatusConflict, "votação não está aberta")
	}
	if time.Now().UTC().After(deadline.UTC()) {
		return voteResponse{}, web.NewError(http.StatusConflict, "prazo de votação encerrado")
	}
	if a.TerritoryID == "" || a.TerritoryID != territoryID {
		return voteResponse{}, web.NewError(http.StatusForbidden, "somente cidadãos vinculados ao território da proposta podem votar")
	}

	receiptCode, err := generateReceiptCode()
	if err != nil {
		return voteResponse{}, err
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO op_votes (voting_id, citizen_id, vote_option, receipt_code)
		VALUES ($1::uuid, $2::uuid, $3, $4)
		ON CONFLICT (voting_id, citizen_id) DO NOTHING
		RETURNING receipt_code
	`, votingID, a.ID, selection, receiptCode).Scan(&receiptCode)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return voteResponse{}, web.NewError(http.StatusConflict, "cidadão já votou nesta votação")
		}
		return voteResponse{}, err
	}

	updateSQL, err := voteCounterUpdateSQL(selection)
	if err != nil {
		return voteResponse{}, web.NewError(http.StatusBadRequest, err.Error())
	}
	if _, err := tx.Exec(ctx, updateSQL, votingID); err != nil {
		return voteResponse{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID:   a.ID,
		Name: a.Name,
		Role: a.Role,
		Type: "citizen",
	}, audit.Event{
		Action:         "op.vote.cast",
		EntityType:     "op_voting",
		EntityID:       votingID,
		EntityPublicID: publicID,
		Metadata: map[string]any{
			"receiptIssued": true,
			"territoryId":   territoryID,
		},
	}); err != nil {
		return voteResponse{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return voteResponse{}, err
	}

	voting, err := r.getVoting(ctx, publicID)
	if err != nil {
		return voteResponse{}, err
	}

	return voteResponse{
		ReceiptCode: receiptCode,
		Voting:      voting,
		Results:     buildResults(voting),
	}, nil
}

func scanVotingRows(rows pgx.Rows) ([]Voting, error) {
	votings := make([]Voting, 0)
	for rows.Next() {
		voting, err := scanVoting(rows)
		if err != nil {
			return nil, err
		}
		votings = append(votings, voting)
	}

	return votings, rows.Err()
}

func scanVoting(row rowScanner) (Voting, error) {
	var voting Voting
	var internalID string
	var deadline time.Time
	var createdAt time.Time
	var updatedAt time.Time

	err := row.Scan(
		&internalID,
		&voting.ID,
		&voting.CycleID,
		&voting.ProposalID,
		&voting.TerritoryID,
		&voting.TerritoryName,
		&voting.Title,
		&voting.Summary,
		&deadline,
		&voting.QuorumNeeded,
		&voting.QuorumReached,
		&voting.VotesYes,
		&voting.VotesNo,
		&voting.VotesAbstain,
		&voting.Status,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return Voting{}, err
	}

	voting.Deadline = deadline.UTC().Format(time.RFC3339)
	voting.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	voting.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	return voting, nil
}

func buildResults(voting Voting) Results {
	totalVotes := voting.VotesYes + voting.VotesNo + voting.VotesAbstain
	return Results{
		ID:              voting.ID,
		Title:           voting.Title,
		Status:          voting.Status,
		Deadline:        voting.Deadline,
		QuorumNeeded:    voting.QuorumNeeded,
		QuorumReached:   voting.QuorumReached,
		QuorumPercent:   percent(voting.QuorumReached, voting.QuorumNeeded),
		TotalVotes:      totalVotes,
		VotesYes:        voting.VotesYes,
		VotesNo:         voting.VotesNo,
		VotesAbstain:    voting.VotesAbstain,
		YesPercent:      percent(voting.VotesYes, totalVotes),
		NoPercent:       percent(voting.VotesNo, totalVotes),
		AbstainPercent:  percent(voting.VotesAbstain, totalVotes),
		ApprovalPercent: percent(voting.VotesYes, voting.VotesYes+voting.VotesNo),
	}
}

func percent(value int, total int) float64 {
	if total <= 0 {
		return 0
	}
	return float64(value) / float64(total) * 100
}

func voteCounterUpdateSQL(selection string) (string, error) {
	switch selection {
	case "Aprovo":
		return `UPDATE op_votings SET votes_yes = votes_yes + 1, quorum_reached = quorum_reached + 1 WHERE id = $1::uuid`, nil
	case "Rejeito":
		return `UPDATE op_votings SET votes_no = votes_no + 1, quorum_reached = quorum_reached + 1 WHERE id = $1::uuid`, nil
	case "Abstenção":
		return `UPDATE op_votings SET votes_abstain = votes_abstain + 1, quorum_reached = quorum_reached + 1 WHERE id = $1::uuid`, nil
	default:
		return "", fmt.Errorf("opção de voto inválida")
	}
}

func nextVotingPublicID(ctx context.Context, tx pgx.Tx) (string, error) {
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(2026061603)); err != nil {
		return "", err
	}

	var nextNumber int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(substring(public_id from 5)::int), 0) + 1
		FROM op_votings
		WHERE public_id ~ '^OPV-[0-9]+$'
	`).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("OPV-%03d", nextNumber), nil
}

func generateReceiptCode() (string, error) {
	var bytes [5]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", err
	}

	return fmt.Sprintf("OP-%d-%s", time.Now().UTC().Year(), strings.ToUpper(hex.EncodeToString(bytes[:]))), nil
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func auditActorType(role string) string {
	switch role {
	case "sysadmin", "admin", "institutional_admin", "legislative_admin", "vereador", "mesa_diretora":
		return "institutional"
	default:
		return "citizen"
	}
}
