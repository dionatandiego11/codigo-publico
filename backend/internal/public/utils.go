package publicapi

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base32"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"codigo-publico/backend/internal/audit"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var errMissingAuthenticatedCitizen = errors.New("missing authenticated citizen")

func nextPublicID(ctx context.Context, tx pgx.Tx, tableName string) (string, error) {
	var advisoryKey int64
	var query string

	switch tableName {
	case "issues":
		advisoryKey = 2026061001
		query = `
			SELECT COALESCE(MAX(substring(public_id from 2)::int), 0) + 1
			FROM issues
			WHERE public_id ~ '^#[0-9]+$'
		`
	case "civic_prs":
		advisoryKey = 2026061002
		query = `
			SELECT COALESCE(MAX(substring(public_id from 2)::int), 0) + 1
			FROM civic_prs
			WHERE public_id ~ '^#[0-9]+$'
		`
	default:
		return "", fmt.Errorf("unsupported public id table %q", tableName)
	}

	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", advisoryKey); err != nil {
		return "", err
	}

	var nextNumber int
	if err := tx.QueryRow(ctx, query).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("#%03d", nextNumber), nil
}

func insertIssueUpvote(ctx context.Context, tx pgx.Tx, issueID string, citizenID string) (bool, error) {
	commandTag, err := tx.Exec(ctx, `
		INSERT INTO issue_upvotes (issue_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
		ON CONFLICT (issue_id, citizen_id) DO NOTHING
	`, issueID, citizenID)
	if err != nil {
		return false, err
	}

	return commandTag.RowsAffected() > 0, nil
}

func insertPRUpvote(ctx context.Context, tx pgx.Tx, civicPRID string, citizenID string) (bool, error) {
	commandTag, err := tx.Exec(ctx, `
		INSERT INTO pr_upvotes (civic_pr_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
		ON CONFLICT (civic_pr_id, citizen_id) DO NOTHING
	`, civicPRID, citizenID)
	if err != nil {
		return false, err
	}

	return commandTag.RowsAffected() > 0, nil
}

// insertAuditEvent delega ao pacote audit, que mantém a cadeia de hashes.
func insertAuditEvent(ctx context.Context, tx pgx.Tx, actor citizenActor, action string, entityType string, entityID string, entityPublicID string, metadata map[string]any) error {
	if metadata == nil {
		metadata = map[string]any{}
	}
	metadata["actorRole"] = actor.Role

	actorType := "citizen"
	if actor.Role == "system" {
		actorType = "system"
	} else if isInstitutionalRole(actor.Role) {
		actorType = "institutional"
	}

	return audit.Insert(ctx, tx, audit.Actor{
		ID:   actor.ID,
		Name: actor.Name,
		Role: actor.Role,
		Type: actorType,
	}, audit.Event{
		Action:         action,
		EntityType:     entityType,
		EntityID:       entityID,
		EntityPublicID: entityPublicID,
		Metadata:       metadata,
	})
}

func parseOptionalDate(value *string) (time.Time, error) {
	if value == nil || strings.TrimSpace(*value) == "" {
		return time.Now().UTC(), nil
	}

	parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*value))
	if err != nil {
		return time.Time{}, err
	}

	return parsed, nil
}

func isInstitutionalRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin", "institutional_admin", "legislative_admin", "procurador", "secretario", "vereador", "mesa_diretora":
		return true
	default:
		return false
	}
}

func canMergePRStatus(status string) bool {
	return status == prStatusFormallyApproved
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}

	return false
}

func normalizeVoteSelection(input voteRequest) (string, error) {
	selection := strings.TrimSpace(input.Selection)
	if selection == "" {
		selection = strings.TrimSpace(input.Vote)
	}

	switch {
	case strings.EqualFold(selection, voteSelectionApprove):
		return voteSelectionApprove, nil
	case strings.EqualFold(selection, voteSelectionReject):
		return voteSelectionReject, nil
	case strings.EqualFold(selection, voteSelectionAbstain), strings.EqualFold(selection, "Abstencao"):
		return voteSelectionAbstain, nil
	default:
		return "", errors.New("selection must be Aprovo, Rejeito or Abstenção")
	}
}

func voteCounterUpdateSQL(selection string) (string, error) {
	switch selection {
	case voteSelectionApprove:
		return `
			UPDATE votings
			SET quorum_reached = quorum_reached + 1,
				votes_yes = votes_yes + 1
			WHERE id = $1::uuid
		`, nil
	case voteSelectionReject:
		return `
			UPDATE votings
			SET quorum_reached = quorum_reached + 1,
				votes_no = votes_no + 1
			WHERE id = $1::uuid
		`, nil
	case voteSelectionAbstain:
		return `
			UPDATE votings
			SET quorum_reached = quorum_reached + 1,
				votes_abstain = votes_abstain + 1
			WHERE id = $1::uuid
		`, nil
	default:
		return "", errors.New("selection must be Aprovo, Rejeito or Abstenção")
	}
}

func generateReceiptCode() (string, error) {
	randomBytes := make([]byte, 10)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	encoded := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(randomBytes)
	if len(encoded) < 12 {
		return "", errors.New("failed to generate receipt code")
	}

	return fmt.Sprintf(
		"CP-%s-%s-%s-%s",
		time.Now().UTC().Format("2006"),
		encoded[0:4],
		encoded[4:8],
		encoded[8:12],
	), nil
}

func buildVotingResults(voting Voting) VotingResults {
	totalVotes := voting.VotesYes + voting.VotesNo + voting.VotesAbstain

	return VotingResults{
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
		ApprovalPercent: percent(voting.VotesYes, totalVotes),
	}
}

func percent(part int, total int) float64 {
	if total <= 0 {
		return 0
	}

	return math.Round((float64(part)/float64(total))*10000) / 100
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}

	return *value
}

func nullableString(value *string) any {
	if value == nil {
		return nil
	}

	cleaned := strings.TrimSpace(*value)
	if cleaned == "" {
		return nil
	}

	return cleaned
}

func nullStringFromSQL(value sql.NullString) any {
	if !value.Valid {
		return nil
	}

	return value.String
}

func cleanStringList(values []string) []string {
	cleaned := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			cleaned = append(cleaned, value)
		}
	}

	return cleaned
}

func articleID(number int) string {
	return "art-" + strconv.Itoa(number)
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}

	return &value.String
}

func formatDate(value time.Time) string {
	return value.UTC().Format("2006-01-02")
}

func formatDateTime(value time.Time) string {
	return value.UTC().Format(time.RFC3339)
}
