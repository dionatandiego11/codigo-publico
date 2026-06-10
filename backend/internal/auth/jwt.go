package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const citizenIDContextKey contextKey = "citizen_id"

type Claims struct {
	CitizenID string `json:"citizenId"`
	Role      string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(secret, citizenID, role string, ttl time.Duration) (string, error) {
	now := time.Now().UTC()

	claims := Claims{
		CitizenID: citizenID,
		Role:      role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   citizenID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func JWTMiddleware(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString, err := bearerToken(r.Header.Get("Authorization"))
			if err != nil {
				writeAuthError(w, http.StatusUnauthorized, "missing or invalid authorization header")
				return
			}

			claims := &Claims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, errors.New("unexpected signing method")
				}

				return []byte(secret), nil
			})
			if err != nil || !token.Valid || claims.CitizenID == "" {
				writeAuthError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), citizenIDContextKey, claims.CitizenID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func CitizenIDFromContext(ctx context.Context) (string, bool) {
	citizenID, ok := ctx.Value(citizenIDContextKey).(string)
	return citizenID, ok && citizenID != ""
}

func NormalizeCPF(value string) string {
	var builder strings.Builder

	for _, r := range value {
		if unicode.IsDigit(r) {
			builder.WriteRune(r)
		}
	}

	return builder.String()
}

func HashCPF(normalizedCPF, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(normalizedCPF))
	return hex.EncodeToString(mac.Sum(nil))
}

func bearerToken(header string) (string, error) {
	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("invalid bearer token")
	}

	return parts[1], nil
}
