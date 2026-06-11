package publicapi

import (
	"errors"
	"net/http"
)

type Service struct {
	repo         *Repository
	stateMachine *PRStateMachine
}

func NewService(repo *Repository) *Service {
	return &Service{
		repo:         repo,
		stateMachine: NewPRStateMachine(),
	}
}

type serviceError struct {
	statusCode int
	message    string
}

func (e serviceError) Error() string {
	return e.message
}

func newServiceError(statusCode int, message string) error {
	return serviceError{
		statusCode: statusCode,
		message:    message,
	}
}

func writeServiceError(w http.ResponseWriter, err error) {
	var appErr serviceError
	if errors.As(err, &appErr) {
		writeErrorMessage(w, appErr.statusCode, appErr.message)
		return
	}

	writeQueryError(w, err)
}
