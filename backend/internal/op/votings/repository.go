package votings

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/op"
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
		v.updated_at,
		p.solution_scope
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
			p.status,
			p.demand_id::text
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
		&rec.DemandID,
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

func (r *Repository) rankingResolutionData(ctx context.Context, identifier string) (ResolvedVotingData, error) {
	var data ResolvedVotingData
	err := r.db.QueryRow(ctx, `
		SELECT
			v.id::text,
			v.public_id,
			v.cycle_id::text,
			v.territory_id::text,
			t.name,
			v.proposal_id::text,
			p.title,
			v.votes_yes,
			v.votes_no,
			v.votes_abstain,
			v.quorum_needed,
			v.quorum_reached
		FROM op_votings v
		JOIN territories t ON t.id = v.territory_id
		JOIN budget_proposals p ON p.id = v.proposal_id
		WHERE v.id::text = $1 OR v.public_id = $1
	`, identifier).Scan(
		&data.VotingID,
		&data.VotingPublicID,
		&data.CycleID,
		&data.TerritoryID,
		&data.TerritoryName,
		&data.ProposalID,
		&data.ProposalTitle,
		&data.VotesYes,
		&data.VotesNo,
		&data.VotesAbstain,
		&data.QuorumNeeded,
		&data.QuorumReached,
	)
	return data, err
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

	var regimentoBytes []byte
	var linkedCitizens int
	if err := tx.QueryRow(ctx, `
		SELECT oc.regimento, COUNT(c.id)::int
		FROM op_cycles oc
		LEFT JOIN citizens c ON c.territory_id = $1::uuid
		WHERE oc.id = $2::uuid
		GROUP BY oc.regimento
	`, proposal.TerritoryID, proposal.CycleID).Scan(&regimentoBytes, &linkedCitizens); err != nil {
		return Voting{}, err
	}

	var reg op.RegimentoLocal
	if err := json.Unmarshal(regimentoBytes, &reg); err != nil {
		return Voting{}, err
	}
	if err := reg.Validate(); err != nil {
		return Voting{}, err
	}
	quorumNeeded := int(math.Ceil(float64(linkedCitizens) * float64(reg.VotingQuorumPct) / 100.0))
	if quorumNeeded < 1 {
		quorumNeeded = 1
	}
	deadline := time.Now().UTC().Add(reg.VotingWindow)

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

	if _, err := tx.Exec(ctx, `
		UPDATE budget_demands
		SET status = 'Em votação', updated_at = NOW()
		WHERE id = $1::uuid
	`, proposal.DemandID); err != nil {
		return Voting{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO demand_events (demand_id, actor_id, actor_type, event_type, visibility, payload)
		VALUES ($1::uuid, $2::uuid, 'system', 'voting_opened', 'public', '{}'::jsonb)
	`, proposal.DemandID, a.ID); err != nil {
		return Voting{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID:   a.ID,
		Name: a.Name,
		Role: a.Role,
		Type: op.AuditActorType(a.Role),
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

// resolveVoting encerra a votação e resolve a proposta: aprovada (quórum atingido
// e mais "Aprovo" que "Rejeito") vira 'Priorizada' e segue para o filtro
// institucional; reprovada volta para maturação. Stage 11 → 12 da esteira.
func (r *Repository) resolveVoting(ctx context.Context, a actor, identifier string) (Voting, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Voting{}, err
	}
	defer rollback(ctx, tx)

	var votingID, publicID, status, proposalID string
	var deadline time.Time
	var quorumNeeded, quorumReached, votesYes, votesNo int
	if err := tx.QueryRow(ctx, `
		SELECT id::text, public_id, status, deadline, quorum_needed, quorum_reached, votes_yes, votes_no, proposal_id::text
		FROM op_votings
		WHERE id::text = $1 OR public_id = $1
		FOR UPDATE
	`, identifier).Scan(&votingID, &publicID, &status, &deadline, &quorumNeeded, &quorumReached, &votesYes, &votesNo, &proposalID); err != nil {
		return Voting{}, err
	}
	if err := canResolveVoting(status, deadline, time.Now().UTC()); err != nil {
		return Voting{}, err
	}

	approved := quorumReached >= quorumNeeded && votesYes > votesNo
	proposalStatus := "Retornada para maturação"
	if approved {
		proposalStatus = "Priorizada"
	}

	if _, err := tx.Exec(ctx, `UPDATE op_votings SET status = 'Encerrada' WHERE id = $1::uuid`, votingID); err != nil {
		return Voting{}, err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE budget_proposals SET status = $1 WHERE id = $2::uuid AND status = 'Em votação'
	`, proposalStatus, proposalID); err != nil {
		return Voting{}, err
	}

	demandStatus := "Não aprovada"
	eventType := "demand_not_approved"
	if approved {
		demandStatus = "Aprovada"
		eventType = "demand_approved"
	}
	var demandID string
	if err := tx.QueryRow(ctx, `
		UPDATE budget_demands d
		SET status = $1, updated_at = NOW()
		FROM budget_proposals p
		WHERE p.id = $2::uuid AND d.id = p.demand_id
		RETURNING d.id::text
	`, demandStatus, proposalID).Scan(&demandID); err != nil {
		return Voting{}, err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO demand_events (demand_id, actor_id, actor_type, event_type, visibility, payload)
		VALUES ($1::uuid, $2::uuid, 'system', $3, 'public', '{}'::jsonb)
	`, demandID, a.ID, eventType); err != nil {
		return Voting{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID: a.ID, Name: a.Name, Role: a.Role, Type: op.AuditActorType(a.Role),
	}, audit.Event{
		Action:         "op.voting.resolved",
		EntityType:     "op_voting",
		EntityID:       votingID,
		EntityPublicID: publicID,
		Metadata:       map[string]any{"approved": approved, "proposalStatus": proposalStatus, "votesYes": votesYes, "votesNo": votesNo},
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

	var votingID, publicID, status, territoryID, cyclePhase, solutionScope string
	var deadline time.Time
	if err := tx.QueryRow(ctx, `
		SELECT
			v.id::text,
			v.public_id,
			v.status,
			v.deadline,
			v.territory_id::text,
			c.phase,
			p.solution_scope
		FROM op_votings v
		JOIN op_cycles c ON c.id = v.cycle_id
		JOIN budget_proposals p ON p.id = v.proposal_id
		WHERE v.id::text = $1 OR v.public_id = $1
		FOR UPDATE
	`, identifier).Scan(&votingID, &publicID, &status, &deadline, &territoryID, &cyclePhase, &solutionScope); err != nil {
		return voteResponse{}, err
	}

	if status != "Aberta" {
		return voteResponse{}, web.NewError(http.StatusConflict, "votação não está aberta")
	}
	if time.Now().UTC().After(deadline.UTC()) {
		return voteResponse{}, web.NewError(http.StatusConflict, "prazo de votação encerrado")
	}
	if cyclePhase != "Votação" {
		return voteResponse{}, web.NewError(http.StatusConflict, "voto só é permitido durante a fase de votação do ciclo")
	}

	isMunicipal := solutionScope == "municipio" || solutionScope == "municipal" || solutionScope == "Escopo municipal"
	if !isMunicipal {
		if a.TerritoryID == "" || a.TerritoryID != territoryID {
			return voteResponse{}, web.NewError(http.StatusForbidden, "somente cidadãos vinculados ao território da proposta podem votar")
		}
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

	var demandID string
	err = tx.QueryRow(ctx, `
		SELECT demand_id::text
		FROM budget_proposals
		WHERE id = (SELECT proposal_id FROM op_votings WHERE id = $1::uuid)
	`, votingID).Scan(&demandID)
	if err != nil {
		return voteResponse{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO demand_events (demand_id, actor_id, actor_type, event_type, visibility, payload)
		VALUES ($1::uuid, $2::uuid, 'citizen', 'vote_cast', 'audit_only', '{}'::jsonb)
	`, demandID, a.ID); err != nil {
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
		&voting.Scope,
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
