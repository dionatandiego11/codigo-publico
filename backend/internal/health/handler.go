package health

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"
)

type Handler struct {
	db      *pgxpool.Pool
	redis  *goredis.Client
	timeout time.Duration
}

type checkResult struct {
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}

type response struct {
	Status    string                 `json:"status"`
	Timestamp string                 `json:"timestamp"`
	Checks    map[string]checkResult `json:"checks"`
}

func NewHandler(db *pgxpool.Pool, redis *goredis.Client, timeout time.Duration) *Handler {
	return &Handler{
		db:      db,
		redis:  redis,
		timeout: timeout,
	}
}

func (h *Handler) Check(w http.ResponseWriter, r *http.Request) {
	checks := map[string]checkResult{
		"api": {
			Status: "ok",
		},
		"postgres": h.checkPostgres(r.Context()),
		"redis":    h.checkRedis(r.Context()),
	}

	status := "ok"
	statusCode := http.StatusOK

	for _, check := range checks {
		if check.Status != "ok" {
			status = "degraded"
			statusCode = http.StatusServiceUnavailable
			break
		}
	}

	writeJSON(w, statusCode, response{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Checks:    checks,
	})
}

func (h *Handler) checkPostgres(parent context.Context) checkResult {
	if h.db == nil {
		return checkResult{Status: "error", Error: "postgres pool is not configured"}
	}

	ctx, cancel := context.WithTimeout(parent, h.timeout)
	defer cancel()

	if err := h.db.Ping(ctx); err != nil {
		return checkResult{Status: "error", Error: err.Error()}
	}

	return checkResult{Status: "ok"}
}

func (h *Handler) checkRedis(parent context.Context) checkResult {
	if h.redis == nil {
		return checkResult{Status: "error", Error: "redis client is not configured"}
	}

	ctx, cancel := context.WithTimeout(parent, h.timeout)
	defer cancel()

	if err := h.redis.Ping(ctx).Err(); err != nil {
		return checkResult{Status: "error", Error: err.Error()}
	}

	return checkResult{Status: "ok"}
}

func writeJSON(w http.ResponseWriter, statusCode int, payload response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
