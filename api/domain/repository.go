package domain

import (
	"context"
	"time"
)

type Repository interface {
	// Auth
	GetUserByEmail(ctx context.Context, email string) (*Usuario, error)
	GetUserByID(ctx context.Context, id int) (*Usuario, error)
	CreateUser(ctx context.Context, email, password, nombre string) (*Usuario, error)
	GetAllUsers(ctx context.Context) ([]Usuario, error)

	// Personal
	CreatePersonal(ctx context.Context, req *CreatePersonalRequest) (*Personal, error)
	GetPersonal(ctx context.Context, id int) (*Personal, error)
	GetPersonalByDNI(ctx context.Context, dni string) (*Personal, error)
	UpdatePersonal(ctx context.Context, id int, req *UpdatePersonalRequest) (*Personal, error)
	SearchPersonal(ctx context.Context, query string, page, limit int) ([]Personal, int, error)
	DeletePersonal(ctx context.Context, id int) error

	// Planilla
	CreatePlanilla(ctx context.Context, userID int, req *CreatePlanillaRequest) (*Planilla, error)
	GetPlanilla(ctx context.Context, id int) (*Planilla, error)
	GetPlanillas(ctx context.Context, personalID *int, mes, anio, page, limit int) ([]Planilla, int, error)
	UpdatePlanilla(ctx context.Context, id int, req *UpdatePlanillaRequest) (*Planilla, error)
	DeletePlanilla(ctx context.Context, id int) error
	GetPlanillaByPersonalAndMonth(ctx context.Context, personalID, mes, anio int) (*Planilla, error)
	GetPreviousPlanilla(ctx context.Context, personalID, mes, anio int) (*Planilla, error)

	// Ingresos y Descuentos
	CreateIngreso(ctx context.Context, planillaID int, ingreso *Ingreso) (*Ingreso, error)
	CreateDescuento(ctx context.Context, planillaID int, descuento *Descuento) (*Descuento, error)
	DeleteIngresosByPlanilla(ctx context.Context, planillaID int) error
	DeleteDescuentosByPlanilla(ctx context.Context, planillaID int) error

	// Refresh tokens
	StoreRefreshToken(ctx context.Context, userID int, token string, expiresAt time.Time) error
	GetRefreshToken(ctx context.Context, userID int) (string, error)
	DeleteRefreshToken(ctx context.Context, userID int) error
}