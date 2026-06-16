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

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/auth"
	"codigo-publico/backend/internal/blockchain"
	"codigo-publico/backend/internal/config"
	"codigo-publico/backend/internal/database"
	"codigo-publico/backend/internal/health"
	appmiddleware "codigo-publico/backend/internal/middleware"
	"codigo-publico/backend/internal/op"
	publicapi "codigo-publico/backend/internal/public"
	appredis "codigo-publico/backend/internal/redis"
	"codigo-publico/backend/internal/territorial"

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
	territorialHandler := territorial.NewHandler(dbPool)
	opHandler := op.NewHandler(dbPool)
	auditHandler := audit.NewHandler(dbPool, blockchain.FromMode(cfg.AnchorMode, logger))

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
			r.Get("/prs/{id}/transitions", publicHandler.GetPRAllowedTransitions)
			r.Post("/votings/{id}/vote", publicHandler.CastVote)

			// Governança territorial
			r.Get("/me/bond", territorialHandler.MyBond)
			r.Post("/territories/{id}/bonds", territorialHandler.RequestBond)
			r.Get("/territories/{id}/bonds", territorialHandler.ListTerritoryBonds)
			r.Post("/bonds/{id}/decision", territorialHandler.DecideBond)
			r.Post("/bonds/{id}/appeal", territorialHandler.AppealBond)
			r.Post("/appeals/{id}/decision", territorialHandler.DecideAppeal)
			r.Post("/bonds/{id}/contest", territorialHandler.ContestBond)
			r.Post("/contestations/{id}/defense", territorialHandler.SubmitDefense)
			r.Post("/contestations/{id}/decision", territorialHandler.DecideContestation)

			// Protocolo de maintainers (nomeação, mandato, destituição e recall)
			r.Post("/territories/{id}/maintainers", territorialHandler.AppointMaintainer)
			r.Get("/territories/{id}/maintainers", territorialHandler.ListMaintainers)
			r.Post("/maintainers/{id}/activate", territorialHandler.ActivateMaintainer)
			r.Post("/maintainers/{id}/renew", territorialHandler.RenewMandate)
			r.Post("/maintainers/{id}/remove", territorialHandler.RemoveMaintainer)
			r.Post("/maintainers/{id}/recall", territorialHandler.OpenRecall)
			r.Post("/recalls/{id}/sign", territorialHandler.SignRecall)

			// Orçamento Participativo: ciclo (instância geral move as fases)
			r.Post("/admin/op/cycles", opHandler.CreateCycle)
			r.Post("/admin/op/cycles/{id}/configure", opHandler.ConfigureCycle)
			r.Post("/admin/op/cycles/{id}/advance", opHandler.AdvanceCycle)
			r.Post("/admin/op/cycles/{id}/cancel", opHandler.CancelCycle)
			r.Post("/admin/op/envelope/preview", opHandler.PreviewEnvelope)

			// Integridade da auditoria (ancoragem exige papel administrativo)
			r.Post("/admin/audit/anchor", auditHandler.CreateAnchor)

			// Encerramento manual de votações vencidas (admin)
			r.Post("/admin/votings/close-expired", publicHandler.CloseExpiredVotings)
		})

		r.Get("/territories", publicHandler.ListTerritories)
		r.Get("/territories/{id}", publicHandler.GetTerritory)
		r.Get("/territories/{id}/governance", territorialHandler.TerritoryGovernance)

		r.Get("/op/cycles", opHandler.ListCycles)
		r.Get("/op/cycles/{id}", opHandler.GetCycle)

		r.Get("/audit/head", auditHandler.GetChainHead)
		r.Get("/audit/anchors", auditHandler.ListAnchors)

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

	// Job em background: encerra votações vencidas mesmo sem novos votos —
	// fecha o ciclo cívico que ficaria solto se ninguém votasse após o prazo.
	go runVotingCloser(shutdownCtx, logger, publicHandler, cfg.VotingCloseInterval)

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

// runVotingCloser executa o encerramento de votações vencidas no startup e a
// cada intervalo, parando no shutdown.
func runVotingCloser(ctx context.Context, logger *slog.Logger, handler *publicapi.Handler, interval time.Duration) {
	closeOnce := func() {
		runCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if n, err := handler.CloseExpiredVotingsSystem(runCtx); err != nil {
			logger.Warn("voting closer failed", "error", err, "closed", n)
		} else if n > 0 {
			logger.Info("expired votings closed", "count", n)
		}
	}

	closeOnce()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			closeOnce()
		}
	}
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
