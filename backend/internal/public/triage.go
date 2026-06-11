package publicapi

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

type updateStatusRequest struct {
	Status string `json:"status"`
}

func (h *Handler) UpdateIssueStatus(w http.ResponseWriter, r *http.Request) {
	var input updateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	issue, err := h.service.UpdateIssueStatus(r.Context(), chi.URLParam(r, "id"), input.Status)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, issue)
}

func (h *Handler) UpdatePRStatus(w http.ResponseWriter, r *http.Request) {
	var input updateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	pr, err := h.service.UpdatePRStatus(r.Context(), chi.URLParam(r, "id"), input.Status)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, pr)
}

func (s *Service) UpdateIssueStatus(ctx context.Context, identifier string, status string) (Issue, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return Issue{}, err
	}

	if !isInstitutionalRole(actor.Role) {
		return Issue{}, newServiceError(http.StatusForbidden, "issue triage requires an institutional role")
	}

	status = strings.TrimSpace(status)
	if !isAllowedIssueStatus(status) {
		return Issue{}, newServiceError(http.StatusBadRequest, "status is not a valid issue status")
	}

	return s.repo.UpdateIssueStatus(ctx, actor, identifier, status)
}

func (s *Service) UpdatePRStatus(ctx context.Context, identifier string, toStatus string) (CivicPR, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return CivicPR{}, err
	}

	toStatus = strings.TrimSpace(toStatus)
	if toStatus == "" {
		return CivicPR{}, newServiceError(http.StatusBadRequest, "status is required")
	}

	// Bloquear tentativa de merge via este endpoint
	if toStatus == prStatusIncorporatedOfficialText {
		return CivicPR{}, newServiceError(http.StatusConflict, "use o endpoint de merge institucional para incorporar um PR")
	}

	return s.repo.UpdatePRStatusWithMachine(ctx, actor, identifier, toStatus, s.stateMachine)
}

func (r *Repository) UpdateIssueStatus(ctx context.Context, actor citizenActor, identifier string, status string) (Issue, error) {
	issueID, publicID, err := r.findIssueIdentity(ctx, identifier)
	if err != nil {
		return Issue{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Issue{}, err
	}
	defer rollbackTx(ctx, tx)

	var previousStatus string
	if err := tx.QueryRow(ctx, `
		SELECT status FROM issues WHERE id = $1::uuid FOR UPDATE
	`, issueID).Scan(&previousStatus); err != nil {
		return Issue{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE issues SET status = $1 WHERE id = $2::uuid
	`, status, issueID); err != nil {
		return Issue{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "issue.status_changed", "issue", issueID, publicID, map[string]any{
		"fromStatus": previousStatus,
		"toStatus":   status,
	}); err != nil {
		return Issue{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Issue{}, err
	}

	return r.GetIssue(ctx, publicID)
}

func (r *Repository) UpdatePRStatus(ctx context.Context, actor citizenActor, identifier string, status string) (CivicPR, error) {
	prID, publicID, err := r.findPRIdentity(ctx, identifier)
	if err != nil {
		return CivicPR{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return CivicPR{}, err
	}
	defer rollbackTx(ctx, tx)

	var previousStatus string
	if err := tx.QueryRow(ctx, `
		SELECT status FROM civic_prs WHERE id = $1::uuid FOR UPDATE
	`, prID).Scan(&previousStatus); err != nil {
		return CivicPR{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE civic_prs SET status = $1 WHERE id = $2::uuid
	`, status, prID); err != nil {
		return CivicPR{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "pr.status_changed", "civic_pr", prID, publicID, map[string]any{
		"fromStatus": previousStatus,
		"toStatus":   status,
	}); err != nil {
		return CivicPR{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return CivicPR{}, err
	}

	return r.GetPR(ctx, publicID)
}
