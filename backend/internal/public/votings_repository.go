package publicapi

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CastVote(ctx context.Context, actor citizenActor, identifier string, selection string) (voteResponse, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return voteResponse{}, err
	}
	defer rollbackTx(ctx, tx)

	votingID, publicID, status, deadline, err := findVotingForUpdate(ctx, tx, identifier)
	if err != nil {
		return voteResponse{}, err
	}
	if status != "Aberta" {
		return voteResponse{}, newServiceError(http.StatusConflict, "voting is not open")
	}
	if time.Now().UTC().After(deadline.UTC()) {
		return voteResponse{}, newServiceError(http.StatusConflict, "voting deadline has passed")
	}

	receiptCode, err := generateReceiptCode()
	if err != nil {
		return voteResponse{}, err
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO voting_votes (voting_id, citizen_id, vote_option, receipt_code)
		VALUES ($1::uuid, $2::uuid, $3, $4)
		ON CONFLICT (voting_id, citizen_id) DO NOTHING
		RETURNING receipt_code
	`, votingID, actor.ID, selection, receiptCode).Scan(&receiptCode)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return voteResponse{}, newServiceError(http.StatusConflict, "citizen has already voted in this voting")
		}

		return voteResponse{}, err
	}

	updateSQL, err := voteCounterUpdateSQL(selection)
	if err != nil {
		return voteResponse{}, newServiceError(http.StatusBadRequest, err.Error())
	}
	if _, err := tx.Exec(ctx, updateSQL, votingID); err != nil {
		return voteResponse{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "vote_cast", "voting", votingID, publicID, map[string]any{
		"receiptIssued": true,
	}); err != nil {
		return voteResponse{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return voteResponse{}, err
	}

	voting, err := r.GetVoting(ctx, publicID)
	if err != nil {
		return voteResponse{}, err
	}

	return voteResponse{
		ReceiptCode: receiptCode,
		Voting:      voting,
		Results:     buildVotingResults(voting),
	}, nil
}
