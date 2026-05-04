package domain

import (
	"errors"
	"time"
)

type FechaHora time.Time

func (f *FechaHora) Scan(value interface{}) error {
	if value == nil {
		*f = FechaHora(time.Time{})
		return nil
	}
	switch v := value.(type) {
	case time.Time:
		*f = FechaHora(v)
	case []byte:
		t, err := time.Parse("2006-01-02T15:04:05Z", string(v))
		if err != nil {
			return err
		}
		*f = FechaHora(t)
	case string:
		t, err := time.Parse("2006-01-02T15:04:05Z", v)
		if err != nil {
			return err
		}
		*f = FechaHora(t)
	default:
		return errors.New("unsupported scan type")
	}
	return nil
}

func (f FechaHora) MarshalJSON() []byte {
	return []byte(`"` + time.Time(f).Format("02/01/2006 15:04:05") + `"`)
}

type Usuario struct {
	ID           int        `json:"id"`
	Nombre       string     `json:"nombre"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	CreatedAt    *FechaHora `json:"created_at"`
}

type Personal struct {
	ID        int        `json:"id"`
	DNI       string     `json:"dni"`
	Nombres   string     `json:"nombres"`
	Apellidos string     `json:"apellidos"`
	Puesto    string     `json:"puesto,omitempty"`
	RD        string     `json:"rd,omitempty"`
	UU        string     `json:"uu,omitempty"`
	Activo    bool       `json:"activo"`
	CreatedAt *FechaHora `json:"created_at"`
}

type Planilla struct {
	ID              int            `json:"id"`
	PersonalID      int            `json:"personal_id"`
	Personal        *Personal      `json:"personal,omitempty"`
	Mes             int            `json:"mes"`
	Anio            int            `json:"anio"`
	TotalHaberes    float64        `json:"total_haberes"`
	TotalDescuentos float64        `json:"total_descuentos"`
	TotalLiquido    float64        `json:"total_liquido"`
	CreadoPor       int            `json:"creado_por"`
	CreadoEn        *FechaHora     `json:"creado_en"`
	Ingresos        []Ingreso     `json:"ingresos,omitempty"`
	Descuentos      []Descuento   `json:"descuentos,omitempty"`
}

type Ingreso struct {
	ID         int     `json:"id"`
	PlanillaID int     `json:"planilla_id,omitempty"`
	Tipo       string  `json:"tipo"`
	Monto      float64 `json:"monto"`
	Comentario string  `json:"comentario,omitempty"`
}

type Descuento struct {
	ID         int     `json:"id"`
	PlanillaID int     `json:"planilla_id,omitempty"`
	Tipo       string  `json:"tipo"`
	Monto      float64 `json:"monto"`
	Comentario string  `json:"comentario,omitempty"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	User  *Usuario    `json:"user"`
	Token *TokenPair `json:"token"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type CreatePersonalRequest struct {
	DNI       string `json:"dni" binding:"min=5,max=20"`
	Nombres   string `json:"nombres" binding:"min=1,max=100"`
	Apellidos string `json:"apellidos" binding:"min=1,max=100"`
	Puesto    string `json:"puesto,omitempty"`
	RD        string `json:"rd,omitempty"`
	UU        string `json:"uu,omitempty"`
}

type UpdatePersonalRequest struct {
	DNI       string `json:"dni" binding:"min=5,max=20"`
	Nombres   string `json:"nombres" binding:"min=1,max=100"`
	Apellidos string `json:"apellidos" binding:"min=1,max=100"`
	Puesto    string `json:"puesto,omitempty"`
	RD        string `json:"rd,omitempty"`
	UU        string `json:"uu,omitempty"`
	Activo    *bool  `json:"activo,omitempty"`
}

type CreatePlanillaRequest struct {
	PersonalID int              `json:"personal_id" binding:"required"`
	Mes        int              `json:"mes" binding:"required,min=1,max=12"`
	Anio       int              `json:"anio" binding:"required,min=2000"`
	Ingresos   []Ingreso        `json:"ingresos"`
	Descuentos []Descuento      `json:"descuentos"`
}

type UpdatePlanillaRequest struct {
	TotalHaberes    float64   `json:"total_haberes"`
	TotalDescuentos float64   `json:"total_descuentos"`
	Ingresos        []Ingreso   `json:"ingresos"`
	Descuentos      []Descuento `json:"descuentos"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}