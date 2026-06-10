package publicapi

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
)

func writeQueryError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeErrorMessage(w, http.StatusNotFound, "resource not found")
		return
	}

	writeError(w, http.StatusInternalServerError, err)
}

func writeAuthOrQueryError(w http.ResponseWriter, err error) {
	if errors.Is(err, errMissingAuthenticatedCitizen) || errors.Is(err, pgx.ErrNoRows) {
		writeErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	writeError(w, http.StatusInternalServerError, err)
}

func writeError(w http.ResponseWriter, statusCode int, err error) {
	writeErrorMessage(w, statusCode, err.Error())
}

func writeErrorMessage(w http.ResponseWriter, statusCode int, message string) {
	writeJSON(w, statusCode, apiError{Error: message})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
