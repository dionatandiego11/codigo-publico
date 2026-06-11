package publicapi

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"net/http"
	"strings"
	"time"
)

type DashboardIssueRef struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"`
}

type DashboardVoteReceipt struct {
	ID        string `json:"id"`
	Selection string `json:"selection"`
	Receipt   string `json:"receipt"`
	TxHash    string `json:"txHash"`
}

type CitizenDashboard struct {
	Name          string                 `json:"name"`
	Email         string                 `json:"email"`
	TerritoryID   string                 `json:"territoryId"`
	TerritoryName string                 `json:"territoryName"`
	RegisteredAt  string                 `json:"registeredAt"`
	CitizenID     string                 `json:"citizenId"`
	CreatedIssues []DashboardIssueRef    `json:"createdIssues"`
	CreatedPRs    []DashboardIssueRef    `json:"createdPRs"`
	VotedList     []DashboardVoteReceipt `json:"votedList"`
	SupportedPRs  []string               `json:"supportedPRs"`
}

func (h *Handler) GetCitizenDashboard(w http.ResponseWriter, r *http.Request) {
	dashboard, err := h.service.GetCitizenDashboard(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, dashboard)
}

func (s *Service) GetCitizenDashboard(ctx context.Context) (CitizenDashboard, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return CitizenDashboard{}, err
	}

	return s.repo.GetCitizenDashboard(ctx, actor)
}

func (r *Repository) GetCitizenDashboard(ctx context.Context, actor citizenActor) (CitizenDashboard, error) {
	dashboard := CitizenDashboard{
		Name:          actor.Name,
		CreatedIssues: []DashboardIssueRef{},
		CreatedPRs:    []DashboardIssueRef{},
		VotedList:     []DashboardVoteReceipt{},
		SupportedPRs:  []string{},
	}

	var email sql.NullString
	var territorySlug sql.NullString
	var territoryName sql.NullString
	var createdAt time.Time

	err := r.db.QueryRow(ctx, `
		SELECT c.email, t.slug, t.name, c.created_at
		FROM citizens c
		LEFT JOIN territories t ON t.id = c.territory_id
		WHERE c.id = $1::uuid
	`, actor.ID).Scan(&email, &territorySlug, &territoryName, &createdAt)
	if err != nil {
		return CitizenDashboard{}, err
	}

	dashboard.Email = email.String
	dashboard.TerritoryID = territorySlug.String
	dashboard.TerritoryName = territoryName.String
	dashboard.RegisteredAt = formatDate(createdAt)
	dashboard.CitizenID = displayCitizenID(actor.ID)

	issueRows, err := r.db.Query(ctx, `
		SELECT public_id, title, status
		FROM issues
		WHERE author_citizen_id = $1::uuid
		ORDER BY created_at DESC
	`, actor.ID)
	if err != nil {
		return CitizenDashboard{}, err
	}
	defer issueRows.Close()

	for issueRows.Next() {
		var ref DashboardIssueRef
		if err := issueRows.Scan(&ref.ID, &ref.Title, &ref.Status); err != nil {
			return CitizenDashboard{}, err
		}
		dashboard.CreatedIssues = append(dashboard.CreatedIssues, ref)
	}
	if err := issueRows.Err(); err != nil {
		return CitizenDashboard{}, err
	}

	prRows, err := r.db.Query(ctx, `
		SELECT public_id, title, status
		FROM civic_prs
		WHERE author_citizen_id = $1::uuid
		ORDER BY created_at DESC
	`, actor.ID)
	if err != nil {
		return CitizenDashboard{}, err
	}
	defer prRows.Close()

	for prRows.Next() {
		var ref DashboardIssueRef
		if err := prRows.Scan(&ref.ID, &ref.Title, &ref.Status); err != nil {
			return CitizenDashboard{}, err
		}
		dashboard.CreatedPRs = append(dashboard.CreatedPRs, ref)
	}
	if err := prRows.Err(); err != nil {
		return CitizenDashboard{}, err
	}

	voteRows, err := r.db.Query(ctx, `
		SELECT v.public_id, vv.vote_option, vv.receipt_code
		FROM voting_votes vv
		JOIN votings v ON v.id = vv.voting_id
		WHERE vv.citizen_id = $1::uuid
		ORDER BY vv.created_at DESC
	`, actor.ID)
	if err != nil {
		return CitizenDashboard{}, err
	}
	defer voteRows.Close()

	for voteRows.Next() {
		var receipt DashboardVoteReceipt
		if err := voteRows.Scan(&receipt.ID, &receipt.Selection, &receipt.Receipt); err != nil {
			return CitizenDashboard{}, err
		}
		receipt.TxHash = receiptTxHash(receipt.Receipt)
		dashboard.VotedList = append(dashboard.VotedList, receipt)
	}
	if err := voteRows.Err(); err != nil {
		return CitizenDashboard{}, err
	}

	supportRows, err := r.db.Query(ctx, `
		SELECT p.public_id
		FROM pr_upvotes u
		JOIN civic_prs p ON p.id = u.civic_pr_id
		WHERE u.citizen_id = $1::uuid
		ORDER BY u.created_at DESC
	`, actor.ID)
	if err != nil {
		return CitizenDashboard{}, err
	}
	defer supportRows.Close()

	for supportRows.Next() {
		var publicID string
		if err := supportRows.Scan(&publicID); err != nil {
			return CitizenDashboard{}, err
		}
		dashboard.SupportedPRs = append(dashboard.SupportedPRs, publicID)
	}
	if err := supportRows.Err(); err != nil {
		return CitizenDashboard{}, err
	}

	return dashboard, nil
}

func displayCitizenID(internalID string) string {
	compact := strings.ToUpper(strings.ReplaceAll(internalID, "-", ""))
	if len(compact) > 8 {
		compact = compact[:8]
	}

	return "CP-CITIZEN-" + compact
}

// receiptTxHash deriva um identificador de exibição estável a partir do recibo,
// sem revelar nada além do próprio recibo que o cidadão já possui.
func receiptTxHash(receiptCode string) string {
	sum := sha256.Sum256([]byte(receiptCode))
	return "0x" + hex.EncodeToString(sum[:8])
}
