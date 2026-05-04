package service

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/planillas/api/domain"
	"golang.org/x/crypto/bcrypt"
)

const (
	MinPasswordLength = 8
	MaxPasswordLength = 128
	MinDNILength      = 5
	MaxDNILength      = 20
	MaxNameLength     = 100
	MaxPuestoLength   = 100
	MaxMontoValue     = 999999999.99
)

var (
	ErrInvalidEmail       = errors.New("email inválido")
	ErrWeakPassword       = errors.New("contraseña muy débil")
	ErrInvalidDNI         = errors.New("DNI inválido")
	ErrInvalidName        = errors.New("nombre inválido")
	ErrInvalidMonto       = errors.New("monto inválido")
	ErrInputTooLong      = errors.New("dato demasiado largo")
	ErrInputTooShort     = errors.New("dato demasiado corto")
)

func ValidateAndSanitizeLogin(email, password string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	password = strings.TrimSpace(password)

	if !isValidEmail(email) {
		return ErrInvalidEmail
	}

	if len(password) < MinPasswordLength || len(password) > MaxPasswordLength {
		return ErrWeakPassword
	}

	return nil
}

func ValidateAndSanitizePersonalInput(req *domain.CreatePersonalRequest) error {
	req.DNI = sanitizeString(req.DNI)
	req.Nombres = sanitizeString(req.Nombres)
	req.Apellidos = sanitizeString(req.Apellidos)
	req.Puesto = sanitizeString(req.Puesto)
	req.RD = sanitizeString(req.RD)
	req.UU = sanitizeString(req.UU)

	if !isValidDNI(req.DNI) {
		return ErrInvalidDNI
	}

	if !isValidName(req.Nombres) || !isValidName(req.Apellidos) {
		return ErrInvalidName
	}

	if len(req.DNI) < MinDNILength || len(req.DNI) > MaxDNILength {
		return ErrInputTooLong
	}

	if len(req.Nombres) > MaxNameLength || len(req.Apellidos) > MaxNameLength {
		return ErrInputTooLong
	}

	if len(req.Puesto) > MaxPuestoLength {
		req.Puesto = req.Puesto[:MaxPuestoLength]
	}

	return nil
}

func ValidateAndSanitizePlanillaInput(req *domain.CreatePlanillaRequest) error {
	if req.PersonalID <= 0 {
		return ErrPersonalNotFound
	}

	if req.Mes < 1 || req.Mes > 12 {
		return errors.New("mes inválido")
	}

	if req.Anio < 2000 || req.Anio > 2100 {
		return errors.New("año inválido")
	}

	for i := range req.Ingresos {
		req.Ingresos[i].Tipo = sanitizeString(req.Ingresos[i].Tipo)
		req.Ingresos[i].Comentario = sanitizeString(req.Ingresos[i].Comentario)

		if req.Ingresos[i].Monto < 0 || req.Ingresos[i].Monto > MaxMontoValue {
			return ErrInvalidMonto
		}

		if len(req.Ingresos[i].Tipo) > 80 {
			req.Ingresos[i].Tipo = req.Ingresos[i].Tipo[:80]
		}
	}

	for i := range req.Descuentos {
		req.Descuentos[i].Tipo = sanitizeString(req.Descuentos[i].Tipo)
		req.Descuentos[i].Comentario = sanitizeString(req.Descuentos[i].Comentario)

		if req.Descuentos[i].Monto < 0 || req.Descuentos[i].Monto > MaxMontoValue {
			return ErrInvalidMonto
		}

		if len(req.Descuentos[i].Tipo) > 80 {
			req.Descuentos[i].Tipo = req.Descuentos[i].Tipo[:80]
		}
	}

	return nil
}

func ValidatePasswordStrength(password string) bool {
	if len(password) < 8 {
		return false
	}

	hasUpper := false
	hasLower := false
	hasDigit := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasDigit = true
		case strings.Contains("!@#$%^&*()_+-=[]{}|;':\",./<>?", string(char)):
			hasSpecial = true
		}
	}

	score := 0
	if hasUpper {
		score++
	}
	if hasLower {
		score++
	}
	if hasDigit {
		score++
	}
	if hasSpecial {
		score++
	}

	return score >= 3
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func sanitizeString(s string) string {
	s = strings.TrimSpace(s)

	re := regexp.MustCompile(`[<>\"'\\x00-\x1F]`)
	s = re.ReplaceAllString(s, "")

	s = removeDuplicateSpaces(s)

	return s
}

func removeDuplicateSpaces(s string) string {
	space := regexp.MustCompile(`\s+`)
	return space.ReplaceAllString(s, " ")
}

func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$`)
	return emailRegex.MatchString(strings.ToLower(email))
}

func isValidDNI(dni string) bool {
	if len(dni) < MinDNILength || len(dni) > MaxDNILength {
		return false
	}

	dniRegex := regexp.MustCompile(`^[A-Z0-9]+$`)
	return dniRegex.MatchString(strings.ToUpper(dni))
}

func isValidName(name string) bool {
	if len(name) == 0 || len(name) > MaxNameLength {
		return false
	}

	nameRegex := regexp.MustCompile(`^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-']+$`)
	return nameRegex.MatchString(name)
}

func isValidMonto(monto float64) bool {
	return monto >= 0 && monto <= MaxMontoValue
}

func GenerateSecureToken() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		timestamp := time.Now().UnixNano()
		str := fmt.Sprintf("%d", timestamp)
		copy(bytes, []byte(str)[:32])
	}
	return base64.URLEncoding.EncodeToString(bytes)
}