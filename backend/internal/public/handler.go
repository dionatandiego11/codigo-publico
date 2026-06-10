package publicapi

import "github.com/jackc/pgx/v5/pgxpool"

type Handler struct {
	service *Service
}

func NewHandler(db *pgxpool.Pool) *Handler {
	repo := NewRepository(db)

	return &Handler{
		service: NewService(repo),
	}
}
