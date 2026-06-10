package redis

import (
	"context"

	goredis "github.com/redis/go-redis/v9"
)

type Pinger interface {
	Ping(context.Context) *goredis.StatusCmd
}

func NewClient(addr, password string, db int) *goredis.Client {
	return goredis.NewClient(&goredis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
}
