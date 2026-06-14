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
	if status != votingStatusOpen {
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

	// ── Resolução automática da votação (Opção A) ────────────────────────────
	// Após registrar o voto, verificar se a votação pode ser encerrada e o PR
	// avançado automaticamente. Quórum atingido + maioria definida → encerrar.
	var quorumNeeded, quorumReached, votesYes, votesNo int
	var civicPRIDNull *string
	if err := tx.QueryRow(ctx, `
		SELECT quorum_needed, quorum_reached, votes_yes, votes_no, civic_pr_id::text
		FROM votings
		WHERE id = $1::uuid
	`, votingID).Scan(&quorumNeeded, &quorumReached, &votesYes, &votesNo, &civicPRIDNull); err != nil {
		return voteResponse{}, err
	}

	sm := NewPRStateMachine()
	deadlineReached := time.Now().UTC().After(deadline.UTC())
	quorumReachedNow := quorumReached >= quorumNeeded
	majorityDefined := votesYes != votesNo

	if quorumReachedNow && majorityDefined {
		trigger := sm.VotingResolutionTrigger(quorumNeeded, quorumReached, votesYes, votesNo)

		if _, err := tx.Exec(ctx, `
			UPDATE votings SET status = $1 WHERE id = $2::uuid
		`, votingStatusClosed, votingID); err != nil {
			return voteResponse{}, err
		}

		if civicPRIDNull != nil && *civicPRIDNull != "" {
			if err := r.advancePRFromVotingResult(ctx, tx, *civicPRIDNull, trigger, sm); err != nil {
				_ = err // PR pode já estar em outro estado; não falhar o voto
			}
		}
	} else if deadlineReached {
		if _, err := tx.Exec(ctx, `
			UPDATE votings SET status = $1 WHERE id = $2::uuid
		`, votingStatusClosed, votingID); err != nil {
			return voteResponse{}, err
		}

		if civicPRIDNull != nil && *civicPRIDNull != "" {
			if err := r.advancePRFromVotingResult(ctx, tx, *civicPRIDNull, "votacao_encerrada_sem_aprovacao", sm); err != nil {
				_ = err
			}
		}
	}
	// ────────────────────────────────────────────────────────────────────────

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

// expiredOpenVotingIDs lista votações abertas cujo prazo já venceu — base do
// encerramento automático por tempo (independente de novos votos).
func (r *Repository) expiredOpenVotingIDs(ctx context.Context) ([]string, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id::text FROM votings
		WHERE status = $1 AND deadline < NOW()
	`, votingStatusOpen)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	return ids, rows.Err()
}

// closeExpiredVoting encerra uma votação vencida e resolve o PR vinculado pela
// máquina de estados, com o ator "system". Idempotente: se a votação já não
// está aberta, não faz nada.
func (r *Repository) closeExpiredVoting(ctx context.Context, votingID string, sm *PRStateMachine) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer rollbackTx(ctx, tx)

	var publicID, status string
	var quorumNeeded, quorumReached, votesYes, votesNo int
	var civicPRIDNull *string
	if err := tx.QueryRow(ctx, `
		SELECT public_id, status, quorum_needed, quorum_reached, votes_yes, votes_no, civic_pr_id::text
		FROM votings
		WHERE id = $1::uuid
		FOR UPDATE
	`, votingID).Scan(&publicID, &status, &quorumNeeded, &quorumReached, &votesYes, &votesNo, &civicPRIDNull); err != nil {
		return err
	}

	// Outro caminho (ex.: voto de última hora) já pode tê-la encerrado.
	if status != votingStatusOpen {
		return tx.Commit(ctx)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE votings SET status = $1 WHERE id = $2::uuid
	`, votingStatusClosed, votingID); err != nil {
		return err
	}

	trigger := sm.VotingResolutionTrigger(quorumNeeded, quorumReached, votesYes, votesNo)
	systemActor := citizenActor{ID: "", Name: "sistema", Role: "system"}

	if err := insertAuditEvent(ctx, tx, systemActor, "voting.closed", "voting", votingID, publicID, map[string]any{
		"reason":  "deadline reached",
		"trigger": trigger,
	}); err != nil {
		return err
	}

	if civicPRIDNull != nil && *civicPRIDNull != "" {
		if err := r.advancePRFromVotingResult(ctx, tx, *civicPRIDNull, trigger, sm); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// advancePRFromVotingResult tenta avançar o status de um PR com base no resultado
// de uma votação encerrada. O ator é o sistema (sem ciudadão real).
// Erros são silenciados pelo chamador — o PR pode já estar em estado diferente.
func (r *Repository) advancePRFromVotingResult(
	ctx context.Context,
	tx pgx.Tx,
	civicPRInternalID string,
	trigger string,
	sm *PRStateMachine,
) error {
	var prPublicID string
	var fromStatus string
	var authorCitizenID string
	if err := tx.QueryRow(ctx, `
		SELECT public_id, status, COALESCE(author_citizen_id::text, '')
		FROM civic_prs
		WHERE id = $1::uuid
		FOR UPDATE
	`, civicPRInternalID).Scan(&prPublicID, &fromStatus, &authorCitizenID); err != nil {
		return err
	}

	// Ator sistema (sem ID real)
	systemActor := citizenActor{ID: "", Name: "sistema", Role: "system"}

	transition, err := sm.TransitionByTrigger(fromStatus, trigger, "system", false)
	if err != nil {
		// PR já em outro estado — ignorar silenciosamente
		return nil
	}

	if _, err := tx.Exec(ctx, `
		UPDATE civic_prs SET status = $1 WHERE id = $2::uuid
	`, transition.ToStatus, civicPRInternalID); err != nil {
		return err
	}

	return recordPRTransitionEvent(
		ctx, tx, systemActor,
		civicPRInternalID, prPublicID,
		fromStatus, transition.ToStatus, transition.Trigger,
		"Encerramento automático por resultado de votação",
	)
}

