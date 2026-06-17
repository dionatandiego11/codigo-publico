package votings

import (
	"net/http"
	"time"

	"codigo-publico/backend/internal/web"
)

func canResolveVoting(status string, deadline time.Time, now time.Time) error {
	if status != "Aberta" {
		return web.NewError(http.StatusConflict, "votação não está aberta")
	}
	if now.UTC().Before(deadline.UTC()) {
		return web.NewError(http.StatusConflict, "votação só pode ser encerrada após o prazo final")
	}
	return nil
}
