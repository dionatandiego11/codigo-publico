// Package web concentra helpers HTTP compartilhados entre módulos de domínio,
// evitando que cada pacote reimplemente serialização e erros de serviço.
package web

import (
	"encoding/json"
	"errors"
	"net/http"
)

// Error é um erro de regra de negócio com status HTTP explícito.
type Error struct {
	StatusCode int
	Message    string
}

func (e Error) Error() string { return e.Message }

func NewError(statusCode int, message string) error {
	return Error{StatusCode: statusCode, Message: message}
}

type errorBody struct {
	Error string `json:"error"`
}

func WriteJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func WriteErrorMessage(w http.ResponseWriter, statusCode int, message string) {
	WriteJSON(w, statusCode, errorBody{Error: message})
}

// WriteError mapeia Error para seu status; qualquer outro erro vira 500.
func WriteError(w http.ResponseWriter, err error) {
	var appErr Error
	if errors.As(err, &appErr) {
		WriteErrorMessage(w, appErr.StatusCode, appErr.Message)
		return
	}

	WriteErrorMessage(w, http.StatusInternalServerError, "internal error")
}
