// Package blockchain ancora provas de integridade em registros externos.
//
// Princípio: a blockchain é um cartório cívico de provas, não um banco de
// dados pessoal. Dados pessoais ficam off-chain; apenas hashes (cabeça da
// cadeia de auditoria, credenciais territoriais) podem ser ancorados.
//
// O MVP traz implementações noop e log. Uma implementação real (ex.: contrato
// em rede pública ou permissionada) deve apenas satisfazer a interface
// Anchorer — nenhum outro módulo precisa mudar.
package blockchain

import (
	"context"
	"log/slog"
)

// Anchorer registra um hash em um meio externo e devolve a referência da prova.
type Anchorer interface {
	Name() string
	Anchor(ctx context.Context, payloadHash string) (txRef string, err error)
}

// NoopAnchorer não ancora nada — útil em desenvolvimento.
type NoopAnchorer struct{}

func (NoopAnchorer) Name() string { return "noop" }

func (NoopAnchorer) Anchor(context.Context, string) (string, error) {
	return "", nil
}

// LogAnchorer registra a âncora no log estruturado da aplicação. Serve como
// prova fraca de existência em ambientes sem blockchain configurada.
type LogAnchorer struct {
	Logger *slog.Logger
}

func (LogAnchorer) Name() string { return "log" }

func (a LogAnchorer) Anchor(_ context.Context, payloadHash string) (string, error) {
	if a.Logger != nil {
		a.Logger.Info("audit chain head anchored", "payloadHash", payloadHash)
	}

	ref := payloadHash
	if len(ref) > 16 {
		ref = ref[:16]
	}

	return "log:" + ref, nil
}

// FromMode resolve o Anchorer a partir da configuração (ANCHOR_MODE).
func FromMode(mode string, logger *slog.Logger) Anchorer {
	switch mode {
	case "log":
		return LogAnchorer{Logger: logger}
	default:
		return NoopAnchorer{}
	}
}
