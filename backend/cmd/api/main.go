package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"codigo-publico/backend/internal/auth"
	"codigo-publico/backend/internal/config"
	"codigo-publico/backend/internal/database"
	"codigo-publico/backend/internal/health"
	appmiddleware "codigo-publico/backend/internal/middleware"
	publicapi "codigo-publico/backend/internal/public"
	appredis "codigo-publico/backend/internal/redis"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

func main() {
	cfg := config.Load()

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	ctx := context.Background()

	dbPool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to configure postgres pool", "error", err)
		os.Exit(1)
	}
	defer dbPool.Close()

	redisClient := appredis.NewClient(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	defer redisClient.Close()

	logInitialDependencyStatus(ctx, logger, cfg, dbPool, redisClient)

	router := chi.NewRouter()
	router.Use(chimiddleware.RequestID)
	router.Use(chimiddleware.RealIP)
	router.Use(chimiddleware.Logger)
	router.Use(chimiddleware.Recoverer)
	router.Use(appmiddleware.CORS(cfg.CORSAllowedOrigins))

	healthHandler := health.NewHandler(dbPool, redisClient, cfg.HealthTimeout)
	publicHandler := publicapi.NewHandler(dbPool)
	authHandler := auth.NewHandler(dbPool, cfg.JWTSecret, cfg.CPFHashSecret, cfg.JWTExpiration)

	router.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler.Check)

		r.Post("/citizens/register", authHandler.RegisterCitizen)
		r.Post("/auth/login", authHandler.Login)
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware(cfg.JWTSecret))
			r.Get("/me", authHandler.Me)
			r.Get("/me/dashboard", publicHandler.GetCitizenDashboard)
			r.Post("/issues", publicHandler.CreateIssue)
			r.Post("/issues/{id}/comments", publicHandler.CreateIssueComment)
			r.Post("/issues/{id}/upvote", publicHandler.UpvoteIssue)
			r.Post("/issues/{id}/status", publicHandler.UpdateIssueStatus)
			r.Post("/prs", publicHandler.CreatePR)
			r.Post("/prs/{id}/comments", publicHandler.CreatePRComment)
			r.Post("/prs/{id}/upvote", publicHandler.UpvotePR)
			r.Post("/prs/{id}/status", publicHandler.UpdatePRStatus)
			r.Post("/prs/{id}/merge", publicHandler.MergePR)
			r.Post("/votings/{id}/vote", publicHandler.CastVote)
		})

		r.Get("/territories", publicHandler.ListTerritories)
		r.Get("/territories/{id}", publicHandler.GetTerritory)

		r.Get("/organic-law/articles", publicHandler.ListLawArticles)
		r.Get("/organic-law/articles/{id}", publicHandler.GetLawArticle)

		r.Get("/issues", publicHandler.ListIssues)
		r.Get("/issues/{id}", publicHandler.GetIssue)

		r.Get("/prs", publicHandler.ListPRs)
		r.Get("/prs/{id}", publicHandler.GetPR)
		r.Get("/prs/{id}/diff", publicHandler.GetPRDiff)
		r.Get("/prs/{id}/reviews", publicHandler.GetPRReviews)
		r.Get("/prs/{id}/checks", publicHandler.GetPRChecks)

		r.Get("/votings", publicHandler.ListVotings)
		r.Get("/votings/{id}", publicHandler.GetVoting)
		r.Get("/votings/{id}/results", publicHandler.GetVotingResults)

		r.Get("/releases", publicHandler.ListReleases)
		r.Get("/releases/{id}", publicHandler.GetRelease)
		r.Get("/executions", publicHandler.ListExecutions)
		r.Get("/public-stats", publicHandler.GetPublicStats)
	})

	server := &http.Server{
		Addr:         cfg.HTTPAddr,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	shutdownCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("api server listening", "addr", cfg.HTTPAddr, "env", cfg.AppEnv)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("api server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-shutdownCtx.Done()
	logger.Info("shutdown signal received")

	timeoutCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := server.Shutdown(timeoutCtx); err != nil {
		logger.Error("api server shutdown failed", "error", err)
		os.Exit(1)
	}

	logger.Info("api server stopped")
}

func logInitialDependencyStatus(ctx context.Context, logger *slog.Logger, cfg config.Config, dbPool database.PoolPinger, redisClient appredis.Pinger) {
	checkCtx, cancel := context.WithTimeout(ctx, cfg.HealthTimeout)
	defer cancel()

	if err := dbPool.Ping(checkCtx); err != nil {
		logger.Warn("postgres is not healthy yet", "error", err)
	} else {
		logger.Info("postgres connection healthy")
	}

	if err := redisClient.Ping(checkCtx).Err(); err != nil {
		logger.Warn("redis is not healthy yet", "error", err)
	} else {
		logger.Info("redis connection healthy")
	}
}
