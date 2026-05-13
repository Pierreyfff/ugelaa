CREATE OR REPLACE FUNCTION update_planilla_haberes()
RETURNS TRIGGER AS $$
DECLARE pid INT;
BEGIN
  IF TG_OP = 'DELETE' THEN pid := OLD.planilla_id; ELSE pid := NEW.planilla_id; END IF;
  UPDATE planilla SET total_haberes = COALESCE((SELECT SUM(monto) FROM ingresos WHERE planilla_id = pid), 0) WHERE id = pid;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_planilla_descuentos()
RETURNS TRIGGER AS $$
DECLARE pid INT;
BEGIN
  IF TG_OP = 'DELETE' THEN pid := OLD.planilla_id; ELSE pid := NEW.planilla_id; END IF;
  UPDATE planilla SET total_descuentos = COALESCE((SELECT SUM(monto) FROM descuentos WHERE planilla_id = pid), 0) WHERE id = pid;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;
