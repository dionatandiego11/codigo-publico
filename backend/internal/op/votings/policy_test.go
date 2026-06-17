package votings

import (
	"errors"
	"net/http"
	"testing"
	"time"

	"codigo-publico/backend/internal/web"
)

func statusOf(t *testing.T, err error) int {
	t.Helper()
	if err == nil {
		return 0
	}
	var appErr web.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("esperava web.Error, obtive %T (%v)", err, err)
	}
	return appErr.StatusCode
}

func TestCanResolveVoting(t *testing.T) {
	now := time.Date(2026, 6, 17, 12, 0, 0, 0, time.UTC)

	if err := canResolveVoting("Aberta", now.Add(-time.Minute), now); err != nil {
		t.Errorf("votação aberta após o prazo deveria encerrar: %v", err)
	}
	if status := statusOf(t, canResolveVoting("Encerrada", now.Add(-time.Minute), now)); status != http.StatusConflict {
		t.Errorf("votação encerrada deveria retornar 409, foi %d", status)
	}
	if status := statusOf(t, canResolveVoting("Aberta", now.Add(time.Minute), now)); status != http.StatusConflict {
		t.Errorf("votação antes do prazo deveria retornar 409, foi %d", status)
	}
}
