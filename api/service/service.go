package service

import (
	"context"
	"errors"
	"os"
	"time"

	"github.com/planillas/api/domain"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("credenciales inválidas")
	ErrUserNotFound       = errors.New("usuario no encontrado")
	ErrPersonalNotFound   = errors.New("personal no encontrado")
	ErrDNIExists          = errors.New("el DNI ya existe")
	ErrPlanillaExists     = errors.New("ya existe una planilla para este personal en el mes y año especificados")
	ErrPlanillaNotFound   = errors.New("planilla no encontrada")
	ErrUnauthorized       = errors.New("no autorizado")
)

type Service struct {
	repo           domain.Repository
	jwtSecret      string
	refreshSecret  string
	accessExpiry   time.Duration
	refreshExpiry  time.Duration
}

func NewService(repo domain.Repository) *Service {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default-secret-change-in-production"
	}
	refreshSecret := os.Getenv("JWT_REFRESH_SECRET")
	if refreshSecret == "" {
		refreshSecret = "default-refresh-secret-change-in-production"
	}

	return &Service{
		repo:           repo,
		jwtSecret:      jwtSecret,
		refreshSecret:  refreshSecret,
		accessExpiry:   15 * 24 * time.Hour,
		refreshExpiry:  15 * 24 * time.Hour,
	}
}

func (s *Service) Login(ctx context.Context, email, password string) (*domain.LoginResponse, error) {
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	accessToken, refreshToken, err := s.generateTokens(user.ID)
	if err != nil {
		return nil, err
	}

	err = s.repo.StoreRefreshToken(ctx, user.ID, refreshToken, time.Now().Add(s.refreshExpiry))
	if err != nil {
		return nil, err
	}

	return &domain.LoginResponse{
		User: user,
		Token: &domain.TokenPair{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	}, nil
}

func (s *Service) RefreshToken(ctx context.Context, refreshToken string) (*domain.TokenPair, error) {
	claims, err := s.parseToken(refreshToken, s.refreshSecret)
	if err != nil {
		return nil, ErrUnauthorized
	}

	userID := int(claims["user_id"].(float64))

	storedToken, err := s.repo.GetRefreshToken(ctx, userID)
	if err != nil || storedToken != refreshToken {
		return nil, ErrUnauthorized
	}

	accessToken, newRefreshToken, err := s.generateTokens(userID)
	if err != nil {
		return nil, err
	}

	err = s.repo.StoreRefreshToken(ctx, userID, newRefreshToken, time.Now().Add(s.refreshExpiry))
	if err != nil {
		return nil, err
	}

	return &domain.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *Service) Logout(ctx context.Context, userID int) error {
	return s.repo.DeleteRefreshToken(ctx, userID)
}

func (s *Service) GetUserByID(ctx context.Context, id int) (*domain.Usuario, error) {
	return s.repo.GetUserByID(ctx, id)
}

func (s *Service) GetUserByEmail(ctx context.Context, email string) (*domain.Usuario, error) {
	return s.repo.GetUserByEmail(ctx, email)
}

func (s *Service) CreateUser(ctx context.Context, email, password, nombre string) (*domain.Usuario, error) {
	return s.repo.CreateUser(ctx, email, password, nombre)
}

func (s *Service) CreateUserWithHash(ctx context.Context, email, password, nombre string) (*domain.Usuario, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return s.repo.CreateUser(ctx, email, string(hash), nombre)
}

func (s *Service) GetAllUsers(ctx context.Context) ([]domain.Usuario, error) {
	return s.repo.GetAllUsers(ctx)
}

func (s *Service) CreatePersonal(ctx context.Context, req *domain.CreatePersonalRequest) (*domain.Personal, error) {
	existing, err := s.repo.GetPersonalByDNI(ctx, req.DNI)
	if err == nil && existing != nil {
		return nil, ErrDNIExists
	}

	return s.repo.CreatePersonal(ctx, req)
}

func (s *Service) GetPersonal(ctx context.Context, id int) (*domain.Personal, error) {
	return s.repo.GetPersonal(ctx, id)
}

func (s *Service) GetPersonalByDNI(ctx context.Context, dni string) (*domain.Personal, error) {
	personal, err := s.repo.GetPersonalByDNI(ctx, dni)
	if err != nil {
		return nil, ErrPersonalNotFound
	}
	return personal, nil
}

func (s *Service) UpdatePersonal(ctx context.Context, id int, req *domain.UpdatePersonalRequest) (*domain.Personal, error) {
	existing, err := s.repo.GetPersonal(ctx, id)
	if err != nil {
		return nil, ErrPersonalNotFound
	}

	if req.DNI != existing.DNI {
		other, err := s.repo.GetPersonalByDNI(ctx, req.DNI)
		if err == nil && other != nil && other.ID != id {
			return nil, ErrDNIExists
		}
	}

	return s.repo.UpdatePersonal(ctx, id, req)
}

func (s *Service) SearchPersonal(ctx context.Context, query string, page, limit int) ([]domain.Personal, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.repo.SearchPersonal(ctx, query, page, limit)
}

func (s *Service) DeletePersonal(ctx context.Context, id int) error {
	_, err := s.repo.GetPersonal(ctx, id)
	if err != nil {
		return ErrPersonalNotFound
	}
	return s.repo.DeletePersonal(ctx, id)
}

func (s *Service) BulkCreateOrUpdatePersonal(ctx context.Context, req *domain.BulkPersonalRequest) (*domain.BulkPersonalResponse, error) {
	resp := &domain.BulkPersonalResponse{}
	
	for i, p := range req.Personal {
		if p.DNI == "" || p.Nombres == "" || p.Apellidos == "" {
			resp.Failed++
			resp.Errors = append(resp.Errors, domain.BulkError{
				Index: i,
				DNI:   p.DNI,
				Error: "DNI, nombres y apellidos son requeridos",
			})
			continue
		}

		existing, err := s.repo.GetPersonalByDNI(ctx, p.DNI)
		if err == nil && existing != nil {
			if req.Mode == "upsert" {
				updateReq := &domain.UpdatePersonalRequest{
					DNI:       p.DNI,
					Nombres:   p.Nombres,
					Apellidos: p.Apellidos,
					Puesto:    p.Puesto,
					RD:        p.RD,
					UU:        p.UU,
				}
				_, err = s.repo.UpdatePersonal(ctx, existing.ID, updateReq)
				if err != nil {
					resp.Failed++
					resp.Errors = append(resp.Errors, domain.BulkError{
						Index: i,
						DNI:   p.DNI,
						Error: "error al actualizar",
					})
				} else {
					resp.Updated++
				}
			} else {
				resp.Failed++
				resp.Errors = append(resp.Errors, domain.BulkError{
					Index: i,
					DNI:   p.DNI,
					Error: "DNI ya existe",
				})
			}
		} else {
			_, err = s.repo.CreatePersonal(ctx, &p)
			if err != nil {
				resp.Failed++
				resp.Errors = append(resp.Errors, domain.BulkError{
					Index: i,
					DNI:   p.DNI,
					Error: "error al crear",
				})
			} else {
				resp.Created++
			}
		}
	}

	return resp, nil
}

func (s *Service) CreatePlanilla(ctx context.Context, userID int, req *domain.CreatePlanillaRequest) (*domain.Planilla, error) {
	existing, err := s.repo.GetPlanillaByPersonalAndMonth(ctx, req.PersonalID, req.Mes, req.Anio)
	if err == nil && existing != nil {
		return nil, ErrPlanillaExists
	}

	_, err = s.repo.GetPersonal(ctx, req.PersonalID)
	if err != nil {
		return nil, ErrPersonalNotFound
	}

	var totalHaberes, totalDescuentos float64
	for _, ing := range req.Ingresos {
		totalHaberes += ing.Monto
	}
	for _, desc := range req.Descuentos {
		totalDescuentos += desc.Monto
	}

	reqWithTotals := *req
	reqWithTotals.Ingresos = req.Ingresos
	reqWithTotals.Descuentos = req.Descuentos

	return s.repo.CreatePlanilla(ctx, userID, &reqWithTotals)
}

func (s *Service) GetPlanilla(ctx context.Context, id int) (*domain.Planilla, error) {
	planilla, err := s.repo.GetPlanilla(ctx, id)
	if err != nil {
		return nil, ErrPlanillaNotFound
	}
	return planilla, nil
}

func (s *Service) GetPlanillas(ctx context.Context, personalID *int, mes, anio, page, limit int) ([]domain.Planilla, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.repo.GetPlanillas(ctx, personalID, mes, anio, page, limit)
}

func (s *Service) UpdatePlanilla(ctx context.Context, id int, req *domain.UpdatePlanillaRequest) (*domain.Planilla, error) {
	_, err := s.repo.GetPlanilla(ctx, id)
	if err != nil {
		return nil, ErrPlanillaNotFound
	}

	reqWithTotals := *req
	reqWithTotals.TotalHaberes = 0
	reqWithTotals.TotalDescuentos = 0

	for _, ing := range req.Ingresos {
		reqWithTotals.TotalHaberes += ing.Monto
	}
	for _, desc := range req.Descuentos {
		reqWithTotals.TotalDescuentos += desc.Monto
	}

	return s.repo.UpdatePlanilla(ctx, id, &reqWithTotals)
}

func (s *Service) DeletePlanilla(ctx context.Context, id int) error {
	_, err := s.repo.GetPlanilla(ctx, id)
	if err != nil {
		return ErrPlanillaNotFound
	}
	return s.repo.DeletePlanilla(ctx, id)
}

func (s *Service) GetPreviousPlanilla(ctx context.Context, personalID, mes, anio int) (*domain.Planilla, error) {
	prev, err := s.repo.GetPreviousPlanilla(ctx, personalID, mes, anio)
	if err != nil {
		return nil, errors.New("no existe planilla anterior")
	}
	return s.repo.GetPlanilla(ctx, prev.ID)
}

func (s *Service) GetPlanillaByPersonalAndMonth(ctx context.Context, personalID, mes, anio int) (*domain.Planilla, error) {
	return s.repo.GetPlanillaByPersonalAndMonth(ctx, personalID, mes, anio)
}

func (s *Service) ValidateAndExtractUserID(token string) (int, error) {
	claims, err := s.parseToken(token, s.jwtSecret)
	if err != nil {
		return 0, ErrUnauthorized
	}
	return int(claims["user_id"].(float64)), nil
}

func (s *Service) ImportPlanillas(ctx context.Context, userID, mes, anio int, workers []domain.PlanillaData) (int, int, int, []string) {
	var created, updated, failed int
	var errors []string

	for _, w := range workers {
		var personalID int
		dniToUse := w.DNI

		if dniToUse == "" {
			dniToUse = "SIN-DNI-" + w.Nombre
		}

		existing, err := s.repo.GetPersonalByDNI(ctx, dniToUse)

		if err != nil {
			createReq := &domain.CreatePersonalRequest{
				DNI:       dniToUse,
				Nombres:   w.Nombre,
				Apellidos: "",
				Puesto:    w.Puesto,
				RD:        w.RD,
				UU:        w.UU,
			}
			newPersonal, err := s.repo.CreatePersonal(ctx, createReq)
			if err != nil {
				failed++
				errors = append(errors, "Error al crear personal: "+dniToUse)
				continue
			}
			personalID = newPersonal.ID
		} else {
			personalID = existing.ID
			if w.Puesto != "" || w.RD != "" || w.UU != "" {
				updateReq := &domain.UpdatePersonalRequest{
					DNI:       existing.DNI,
					Nombres:   existing.Nombres,
					Apellidos: existing.Apellidos,
					Puesto:    w.Puesto,
					RD:        w.RD,
					UU:        w.UU,
				}
				s.repo.UpdatePersonal(ctx, existing.ID, updateReq)
			}
		}

		existingPlanilla, err := s.repo.GetPlanillaByPersonalAndMonth(ctx, personalID, mes, anio)
		if err == nil && existingPlanilla != nil {
			updateReq := &domain.UpdatePlanillaRequest{
				TotalHaberes:    0,
				TotalDescuentos: 0,
				Ingresos:        w.Ingresos,
				Descuentos:      w.Descuentos,
			}
			for _, ing := range w.Ingresos {
				updateReq.TotalHaberes += ing.Monto
			}
			for _, desc := range w.Descuentos {
				updateReq.TotalDescuentos += desc.Monto
			}
			s.repo.UpdatePlanilla(ctx, existingPlanilla.ID, updateReq)
			updated++
		} else {
			createReq := &domain.CreatePlanillaRequest{
				PersonalID: personalID,
				Mes:        mes,
				Anio:       anio,
				Ingresos:   w.Ingresos,
				Descuentos: w.Descuentos,
			}
			_, err := s.repo.CreatePlanilla(ctx, userID, createReq)
			if err != nil {
				failed++
				errors = append(errors, "Error al crear planilla para: "+dniToUse)
			} else {
				created++
			}
		}
	}

	return created, updated, failed, errors
}