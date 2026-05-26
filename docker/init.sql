-- Sistema de Planillas - Schema de Base de Datos
-- PostgreSQL

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de personal
CREATE TABLE IF NOT EXISTS personal (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    puesto VARCHAR(100),
    rd VARCHAR(50),
    uu VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de planilla
CREATE TABLE IF NOT EXISTS planilla (
    id SERIAL PRIMARY KEY,
    personal_id INT NOT NULL REFERENCES personal(id),
    mes SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio SMALLINT NOT NULL CHECK (anio >= 1900),
    institucion VARCHAR(200),
    distrito VARCHAR(150),
    total_haberes NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_descuentos NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_liquido NUMERIC(12,2) GENERATED ALWAYS AS (total_haberes - total_descuentos) STORED,
    creado_por INT REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (personal_id, mes, anio)
);

-- Tabla de ingresos
CREATE TABLE IF NOT EXISTS ingresos (
    id SERIAL PRIMARY KEY,
    planilla_id INT NOT NULL REFERENCES planilla(id) ON DELETE CASCADE,
    tipo VARCHAR(80) NOT NULL,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    comentario TEXT
);

-- Tabla de descuentos
CREATE TABLE IF NOT EXISTS descuentos (
    id SERIAL PRIMARY KEY,
    planilla_id INT NOT NULL REFERENCES planilla(id) ON DELETE CASCADE,
    tipo VARCHAR(80) NOT NULL,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    comentario TEXT
);

-- Migración para añadir nuevas columnas (seguro para ejecutar múltiples veces)
ALTER TABLE planilla ADD COLUMN IF NOT EXISTS institucion VARCHAR(200);
ALTER TABLE planilla ADD COLUMN IF NOT EXISTS distrito VARCHAR(150);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_planilla_personal ON planilla(personal_id);
CREATE INDEX IF NOT EXISTS idx_planilla_mes_anio ON planilla(mes, anio);
CREATE INDEX IF NOT EXISTS idx_ingresos_planilla ON ingresos(planilla_id);
CREATE INDEX IF NOT EXISTS idx_descuentos_planilla ON descuentos(planilla_id);
CREATE INDEX IF NOT EXISTS idx_personal_dni ON personal(dni);
CREATE INDEX IF NOT EXISTS idx_personal_nombre ON personal(apellidos, nombres);

-- Trigger para actualizar total_haberes en ingresos
CREATE OR REPLACE FUNCTION update_planilla_haberes()
RETURNS TRIGGER AS $$
DECLARE pid INT;
BEGIN
    IF TG_OP = 'DELETE' THEN pid := OLD.planilla_id; ELSE pid := NEW.planilla_id; END IF;
    UPDATE planilla
    SET total_haberes = COALESCE(
        (SELECT SUM(monto) FROM ingresos WHERE planilla_id = pid), 0
    )
    WHERE id = pid;
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_haberes
AFTER INSERT OR UPDATE OR DELETE ON ingresos
FOR EACH ROW EXECUTE FUNCTION update_planilla_haberes();

-- Trigger para actualizar total_descuentos en descuentos
CREATE OR REPLACE FUNCTION update_planilla_descuentos()
RETURNS TRIGGER AS $$
DECLARE pid INT;
BEGIN
    IF TG_OP = 'DELETE' THEN pid := OLD.planilla_id; ELSE pid := NEW.planilla_id; END IF;
    UPDATE planilla
    SET total_descuentos = COALESCE(
        (SELECT SUM(monto) FROM descuentos WHERE planilla_id = pid), 0
    )
    WHERE id = pid;
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_descuentos
AFTER INSERT OR UPDATE OR DELETE ON descuentos
FOR EACH ROW EXECUTE FUNCTION update_planilla_descuentos();