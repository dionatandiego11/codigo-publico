package database

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PoolPinger interface {
	Ping(context.Context) error
}

func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	poolConfig.MaxConns = 10
	poolConfig.MinConns = 1
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.MaxConnIdleTime = 5 * time.Minute

	return pgxpool.NewWithConfig(ctx, poolConfig)
}
