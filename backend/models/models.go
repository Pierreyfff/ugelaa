package models

import (
	"time"
)

type Usuario struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Nombre       string    `json:"nombre" gorm:"size:100;not null"`
	Email        string    `json:"email" gorm:"size:150;uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"size:255;not null"`
	CreatedAt    time.Time `json:"created_at"`
}

type Personal struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	DNI       string    `json:"dni" gorm:"size:20"`
	Nombres   string    `json:"nombres" gorm:"size:100;not null"`
	Apellidos string    `json:"apellidos" gorm:"size:100;not null"`
	Puesto    string    `json:"puesto" gorm:"size:100"`
	RD        string    `json:"rd" gorm:"size:50"`
	UU        string    `json:"uu" gorm:"size:50"`
	Activo    bool      `json:"activo" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
}

type Planilla struct {
	ID              uint        `json:"id" gorm:"primaryKey"`
	PersonalID      uint        `json:"personal_id" gorm:"not null"`
	Personal        Personal    `json:"personal,omitempty" gorm:"foreignKey:PersonalID"`
	Mes             int16       `json:"mes" gorm:"not null"`
	Anio            int16       `json:"anio" gorm:"not null"`
	TotalHaberes    float64     `json:"total_haberes" gorm:"default:0"`
	TotalDescuentos float64     `json:"total_descuentos" gorm:"default:0"`
	TotalLiquido    float64     `json:"total_liquido" gorm:"-"`
	CreadoPor       *uint       `json:"creado_por"`
	CreadoEn        time.Time   `json:"creado_en"`
	Ingresos        []Ingreso   `json:"ingresos,omitempty" gorm:"foreignKey:PlanillaID"`
	Descuentos      []Descuento `json:"descuentos,omitempty" gorm:"foreignKey:PlanillaID"`
}

func (p *Planilla) CalculateTotal() {
	p.TotalLiquido = p.TotalHaberes - p.TotalDescuentos
}

type Ingreso struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	PlanillaID uint    `json:"planilla_id" gorm:"not null"`
	Tipo       string  `json:"tipo" gorm:"size:80;not null"`
	Monto      float64 `json:"monto" gorm:"default:0"`
	Comentario string  `json:"comentario" gorm:"type:text"`
}

type Descuento struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	PlanillaID uint    `json:"planilla_id" gorm:"not null"`
	Tipo       string  `json:"tipo" gorm:"size:80;not null"`
	Monto      float64 `json:"monto" gorm:"default:0"`
	Comentario string  `json:"comentario" gorm:"type:text"`
}

type DataExcel struct {
	Personal  []Personal       `json:"personal"`
	Planillas []PlanillaImport `json:"planillas"`
}

type PlanillaImport struct {
	DNI        string            `json:"dni"`
	Nombres    string            `json:"nombres"`
	Mes        int               `json:"mes"`
	Anio       int               `json:"anio"`
	Ingresos   []IngresoImport   `json:"ingresos"`
	Descuentos []DescuentoImport `json:"descuentos"`
}

type IngresoImport struct {
	Tipo  string  `json:"tipo"`
	Monto float64 `json:"monto"`
}

type DescuentoImport struct {
	Tipo  string  `json:"tipo"`
	Monto float64 `json:"monto"`
}
