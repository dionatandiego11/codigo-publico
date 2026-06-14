package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv             string
	HTTPAddr           string
	DatabaseURL        string
	RedisAddr          string
	RedisPassword      string
	RedisDB            int
	CORSAllowedOrigins []string
	JWTSecret          string
	JWTExpiration      time.Duration
	CPFHashSecret      string
	HealthTimeout       time.Duration
	ShutdownTimeout     time.Duration
	AnchorMode          string
	VotingCloseInterval time.Duration
}

func Load() Config {
	_ = godotenv.Load(".env")

	port := getEnv("PORT", "8080")

	return Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		HTTPAddr:           ":" + port,
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://codigo_publico:codigo_publico@localhost:5432/codigo_publico?sslmode=disable"),
		RedisAddr:          getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:      getEnv("REDIS_PASSWORD", ""),
		RedisDB:            getEnvAsInt("REDIS_DB", 0),
		CORSAllowedOrigins: getEnvAsList("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://127.0.0.1:3000"}),
		JWTSecret:          getEnv("JWT_SECRET", "dev-jwt-secret-change-me"),
		JWTExpiration:      getEnvAsDuration("JWT_EXPIRATION", 24*time.Hour),
		CPFHashSecret:      getEnv("CPF_HASH_SECRET", "dev-cpf-hash-secret-change-me"),
		HealthTimeout:      getEnvAsDuration("HEALTH_TIMEOUT", 2*time.Second),
		ShutdownTimeout:    getEnvAsDuration("SHUTDOWN_TIMEOUT", 10*time.Second),
		AnchorMode:          getEnv("ANCHOR_MODE", "log"),
		VotingCloseInterval: getEnvAsDuration("VOTING_CLOSE_INTERVAL", time.Minute),
	}
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getEnvAsInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func getEnvAsDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func getEnvAsList(key string, fallback []string) []string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))

	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			result = append(result, item)
		}
	}

	if len(result) == 0 {
		return fallback
	}

	return result
}
