package repository

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/planillas/api/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository() (*PostgresRepository, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &PostgresRepository{pool: pool}, nil
}

func (r *PostgresRepository) GetUserByEmail(ctx context.Context, email string) (*domain.Usuario, error) {
	var user domain.Usuario
	err := r.pool.QueryRow(ctx,
		"SELECT id, nombre, email, password_hash, created_at FROM usuarios WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Nombre, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *PostgresRepository) GetUserByID(ctx context.Context, id int) (*domain.Usuario, error) {
	var user domain.Usuario
	err := r.pool.QueryRow(ctx,
		"SELECT id, nombre, email, password_hash, created_at FROM usuarios WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Nombre, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *PostgresRepository) StoreRefreshToken(ctx context.Context, userID int, token string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx,
		"INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3",
		userID, token, expiresAt,
	)
	return err
}

func (r *PostgresRepository) GetRefreshToken(ctx context.Context, userID int) (string, error) {
	var token string
	err := r.pool.QueryRow(ctx,
		"SELECT token FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW()",
		userID,
	).Scan(&token)
	return token, err
}

func (r *PostgresRepository) DeleteRefreshToken(ctx context.Context, userID int) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM refresh_tokens WHERE user_id = $1", userID)
	return err
}

func (r *PostgresRepository) CreateUser(ctx context.Context, email, password, nombre string) (*domain.Usuario, error) {
	var user domain.Usuario
	err := r.pool.QueryRow(ctx,
		`INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3)
		 RETURNING id, nombre, email, password_hash, created_at`,
		nombre, email, password,
	).Scan(&user.ID, &user.Nombre, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *PostgresRepository) GetAllUsers(ctx context.Context) ([]domain.Usuario, error) {
	rows, err := r.pool.Query(ctx, "SELECT id, nombre, email, created_at FROM usuarios ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []domain.Usuario
	for rows.Next() {
		var u domain.Usuario
		if err := rows.Scan(&u.ID, &u.Nombre, &u.Email, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *PostgresRepository) CreatePersonal(ctx context.Context, req *domain.CreatePersonalRequest) (*domain.Personal, error) {
	var p domain.Personal
	err := r.pool.QueryRow(ctx,
		`INSERT INTO personal (dni, nombres, apellidos, puesto, rd, uu, activo)
		 VALUES ($1, $2, $3, $4, $5, $6, TRUE)
		 RETURNING id, dni, nombres, apellidos, puesto, rd, uu, activo, created_at`,
		req.DNI, req.Nombres, req.Apellidos, req.Puesto, req.RD, req.UU,
	).Scan(&p.ID, &p.DNI, &p.Nombres, &p.Apellidos, &p.Puesto, &p.RD, &p.UU, &p.Activo, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresRepository) GetPersonal(ctx context.Context, id int) (*domain.Personal, error) {
	var p domain.Personal
	err := r.pool.QueryRow(ctx,
		`SELECT id, dni, nombres, apellidos, puesto, rd, uu, activo, created_at 
		 FROM personal WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.DNI, &p.Nombres, &p.Apellidos, &p.Puesto, &p.RD, &p.UU, &p.Activo, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresRepository) GetPersonalByDNI(ctx context.Context, dni string) (*domain.Personal, error) {
	var p domain.Personal
	err := r.pool.QueryRow(ctx,
		`SELECT id, dni, nombres, apellidos, puesto, rd, uu, activo, created_at 
		 FROM personal WHERE dni = $1`,
		dni,
	).Scan(&p.ID, &p.DNI, &p.Nombres, &p.Apellidos, &p.Puesto, &p.RD, &p.UU, &p.Activo, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresRepository) UpdatePersonal(ctx context.Context, id int, req *domain.UpdatePersonalRequest) (*domain.Personal, error) {
	var p domain.Personal
	err := r.pool.QueryRow(ctx,
		`UPDATE personal 
		 SET dni = $1, nombres = $2, apellidos = $3, puesto = $4, rd = $5, uu = $6, activo = COALESCE($7, activo)
		 WHERE id = $8
		 RETURNING id, dni, nombres, apellidos, puesto, rd, uu, activo, created_at`,
		req.DNI, req.Nombres, req.Apellidos, req.Puesto, req.RD, req.UU, req.Activo, id,
	).Scan(&p.ID, &p.DNI, &p.Nombres, &p.Apellidos, &p.Puesto, &p.RD, &p.UU, &p.Activo, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresRepository) SearchPersonal(ctx context.Context, query string, page, limit int) ([]domain.Personal, int, error) {
	offset := (page - 1) * limit

	var count int
	var err error

	if query == "" {
		err = r.pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM personal WHERE activo = TRUE`,
		).Scan(&count)
	} else {
		err = r.pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM personal 
			 WHERE (apellidos ILIKE $1 OR nombres ILIKE $1 OR dni ILIKE $1) AND activo = TRUE`,
			"%"+query+"%",
		).Scan(&count)
	}
	if err != nil {
		return nil, 0, err
	}

	var rows pgx.Rows
	if query == "" {
		rows, err = r.pool.Query(ctx,
			`SELECT id, dni, nombres, apellidos, puesto, rd, uu, activo, created_at 
			 FROM personal 
			 WHERE activo = TRUE
			 ORDER BY apellidos, nombres
			 LIMIT $1 OFFSET $2`,
			limit, offset,
		)
	} else {
		rows, err = r.pool.Query(ctx,
			`SELECT id, dni, nombres, apellidos, puesto, rd, uu, activo, created_at 
			 FROM personal 
			 WHERE (apellidos ILIKE $1 OR nombres ILIKE $1 OR dni ILIKE $1) AND activo = TRUE
			 ORDER BY apellidos, nombres
			 LIMIT $2 OFFSET $3`,
			"%"+query+"%", limit, offset,
		)
	}
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var personal []domain.Personal
	for rows.Next() {
		var p domain.Personal
		if err := rows.Scan(&p.ID, &p.DNI, &p.Nombres, &p.Apellidos, &p.Puesto, &p.RD, &p.UU, &p.Activo, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		personal = append(personal, p)
	}

	return personal, count, nil
}

func (r *PostgresRepository) DeletePersonal(ctx context.Context, id int) error {
	result, err := r.pool.Exec(ctx, "UPDATE personal SET activo = FALSE WHERE id = $1", id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("personal not found")
	}
	return nil
}

func (r *PostgresRepository) CreatePlanilla(ctx context.Context, userID int, req *domain.CreatePlanillaRequest) (*domain.Planilla, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var totalHaberes, totalDescuentos float64
	for _, ing := range req.Ingresos {
		totalHaberes += ing.Monto
	}
	for _, desc := range req.Descuentos {
		totalDescuentos += desc.Monto
	}

	var planilla domain.Planilla
	err = tx.QueryRow(ctx,
		`INSERT INTO planilla (personal_id, mes, anio, total_haberes, total_descuentos, creado_por)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, personal_id, mes, anio, total_haberes, total_descuentos, total_liquido, creado_por, creado_en`,
		req.PersonalID, req.Mes, req.Anio, totalHaberes, totalDescuentos, userID,
	).Scan(&planilla.ID, &planilla.PersonalID, &planilla.Mes, &planilla.Anio, &planilla.TotalHaberes, &planilla.TotalDescuentos, &planilla.TotalLiquido, &planilla.CreadoPor, &planilla.CreadoEn)
	if err != nil {
		return nil, err
	}

	for _, ing := range req.Ingresos {
		_, err = tx.Exec(ctx,
			`INSERT INTO ingresos (planilla_id, tipo, monto, comentario) VALUES ($1, $2, $3, $4)`,
			planilla.ID, ing.Tipo, ing.Monto, ing.Comentario,
		)
		if err != nil {
			return nil, err
		}
	}

	for _, desc := range req.Descuentos {
		_, err = tx.Exec(ctx,
			`INSERT INTO descuentos (planilla_id, tipo, monto, comentario) VALUES ($1, $2, $3, $4)`,
			planilla.ID, desc.Tipo, desc.Monto, desc.Comentario,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetPlanilla(ctx, planilla.ID)
}

func (r *PostgresRepository) GetPlanilla(ctx context.Context, id int) (*domain.Planilla, error) {
	var p domain.Planilla
	err := r.pool.QueryRow(ctx,
		`SELECT id, personal_id, mes, anio, total_haberes, total_descuentos, total_liquido, creado_por, creado_en
		 FROM planilla WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.PersonalID, &p.Mes, &p.Anio, &p.TotalHaberes, &p.TotalDescuentos, &p.TotalLiquido, &p.CreadoPor, &p.CreadoEn)
	if err != nil {
		return nil, err
	}

	personal, err := r.GetPersonal(ctx, p.PersonalID)
	if err == nil {
		p.Personal = personal
	}

	ingresos, err := r.getIngresosByPlanilla(ctx, id)
	if err == nil {
		p.Ingresos = ingresos
	}

	descuentos, err := r.getDescuentosByPlanilla(ctx, id)
	if err == nil {
		p.Descuentos = descuentos
	}

	return &p, nil
}

func (r *PostgresRepository) getIngresosByPlanilla(ctx context.Context, planillaID int) ([]domain.Ingreso, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, planilla_id, tipo, monto, comentario FROM ingresos WHERE planilla_id = $1`,
		planillaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ingresos []domain.Ingreso
	for rows.Next() {
		var ing domain.Ingreso
		if err := rows.Scan(&ing.ID, &ing.PlanillaID, &ing.Tipo, &ing.Monto, &ing.Comentario); err != nil {
			return nil, err
		}
		ingresos = append(ingresos, ing)
	}
	return ingresos, nil
}

func (r *PostgresRepository) getDescuentosByPlanilla(ctx context.Context, planillaID int) ([]domain.Descuento, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, planilla_id, tipo, monto, comentario FROM descuentos WHERE planilla_id = $1`,
		planillaID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var descuentos []domain.Descuento
	for rows.Next() {
		var desc domain.Descuento
		if err := rows.Scan(&desc.ID, &desc.PlanillaID, &desc.Tipo, &desc.Monto, &desc.Comentario); err != nil {
			return nil, err
		}
		descuentos = append(descuentos, desc)
	}
	return descuentos, nil
}

func (r *PostgresRepository) GetPlanillas(ctx context.Context, personalID *int, mes, anio, page, limit int) ([]domain.Planilla, int, error) {
	offset := (page - 1) * limit

	baseQuery := "FROM planilla p JOIN personal per ON p.personal_id = per.id WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if personalID != nil {
		baseQuery += fmt.Sprintf(" AND p.personal_id = $%d", argIndex)
		args = append(args, *personalID)
		argIndex++
	}
	if mes > 0 {
		baseQuery += fmt.Sprintf(" AND p.mes = $%d", argIndex)
		args = append(args, mes)
		argIndex++
	}
	if anio > 0 {
		baseQuery += fmt.Sprintf(" AND p.anio = $%d", argIndex)
		args = append(args, anio)
		argIndex++
	}

	var count int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*)"+baseQuery, args...).Scan(&count)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT p.id, p.personal_id, p.mes, p.anio, p.total_haberes, p.total_descuentos, p.total_liquido, p.creado_por, p.creado_en, per.id, per.dni, per.nombres, per.apellidos, per.puesto, per.rd, per.uu, per.activo, per.created_at %s ORDER BY p.anio DESC, p.mes DESC LIMIT $%d OFFSET $%d`, baseQuery, argIndex, argIndex+1)
	args = append(args, limit, offset)
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var planillas []domain.Planilla
	for rows.Next() {
		var p domain.Planilla
		var per domain.Personal
		if err := rows.Scan(&p.ID, &p.PersonalID, &p.Mes, &p.Anio, &p.TotalHaberes, &p.TotalDescuentos, &p.TotalLiquido, &p.CreadoPor, &p.CreadoEn, &per.ID, &per.DNI, &per.Nombres, &per.Apellidos, &per.Puesto, &per.RD, &per.UU, &per.Activo, &per.CreatedAt); err != nil {
			return nil, 0, err
		}
		p.Personal = &per
		planillas = append(planillas, p)
	}

	return planillas, count, nil
}

func (r *PostgresRepository) UpdatePlanilla(ctx context.Context, id int, req *domain.UpdatePlanillaRequest) (*domain.Planilla, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var totalHaberes, totalDescuentos float64
	for _, ing := range req.Ingresos {
		totalHaberes += ing.Monto
	}
	for _, desc := range req.Descuentos {
		totalDescuentos += desc.Monto
	}

	_, err = tx.Exec(ctx,
		`UPDATE planilla SET total_haberes = $1, total_descuentos = $2 WHERE id = $3`,
		totalHaberes, totalDescuentos, id,
	)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `DELETE FROM ingresos WHERE planilla_id = $1`, id)
	if err != nil {
		return nil, err
	}
	_, err = tx.Exec(ctx, `DELETE FROM descuentos WHERE planilla_id = $1`, id)
	if err != nil {
		return nil, err
	}

	for _, ing := range req.Ingresos {
		_, err = tx.Exec(ctx,
			`INSERT INTO ingresos (planilla_id, tipo, monto, comentario) VALUES ($1, $2, $3, $4)`,
			id, ing.Tipo, ing.Monto, ing.Comentario,
		)
		if err != nil {
			return nil, err
		}
	}

	for _, desc := range req.Descuentos {
		_, err = tx.Exec(ctx,
			`INSERT INTO descuentos (planilla_id, tipo, monto, comentario) VALUES ($1, $2, $3, $4)`,
			id, desc.Tipo, desc.Monto, desc.Comentario,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetPlanilla(ctx, id)
}

func (r *PostgresRepository) DeletePlanilla(ctx context.Context, id int) error {
	result, err := r.pool.Exec(ctx, "DELETE FROM planilla WHERE id = $1", id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("planilla not found")
	}
	return nil
}

func (r *PostgresRepository) GetPlanillaByPersonalAndMonth(ctx context.Context, personalID, mes, anio int) (*domain.Planilla, error) {
	var p domain.Planilla
	err := r.pool.QueryRow(ctx,
		`SELECT id, personal_id, mes, anio, total_haberes, total_descuentos, total_liquido, creado_por, creado_en
		 FROM planilla WHERE personal_id = $1 AND mes = $2 AND anio = $3`,
		personalID, mes, anio,
	).Scan(&p.ID, &p.PersonalID, &p.Mes, &p.Anio, &p.TotalHaberes, &p.TotalDescuentos, &p.TotalLiquido, &p.CreadoPor, &p.CreadoEn)
	if err != nil {
		return nil, err
	}

	ingresos, err := r.getIngresosByPlanilla(ctx, p.ID)
	if err == nil {
		p.Ingresos = ingresos
		var totalIng float64
		for _, ing := range ingresos {
			totalIng += ing.Monto
		}
		if totalIng > 0 && p.TotalHaberes == 0 {
			p.TotalHaberes = totalIng
		}
	}

	descuentos, err := r.getDescuentosByPlanilla(ctx, p.ID)
	if err == nil {
		p.Descuentos = descuentos
		var totalDesc float64
		for _, desc := range descuentos {
			totalDesc += desc.Monto
		}
		if totalDesc > 0 && p.TotalDescuentos == 0 {
			p.TotalDescuentos = totalDesc
		}
	}

	p.TotalLiquido = p.TotalHaberes - p.TotalDescuentos

	return &p, nil
}

func (r *PostgresRepository) GetPreviousPlanilla(ctx context.Context, personalID, mes, anio int) (*domain.Planilla, error) {
	var p domain.Planilla
	err := r.pool.QueryRow(ctx,
		`SELECT id, personal_id, mes, anio, total_haberes, total_descuentos, total_liquido, creado_por, creado_en
		 FROM planilla 
		 WHERE personal_id = $1 AND ((anio = $2 AND mes < $3) OR (anio < $2))
		 ORDER BY anio DESC, mes DESC
		 LIMIT 1`,
		personalID, anio, mes,
	).Scan(&p.ID, &p.PersonalID, &p.Mes, &p.Anio, &p.TotalHaberes, &p.TotalDescuentos, &p.TotalLiquido, &p.CreadoPor, &p.CreadoEn)
	if err != nil {
		return nil, err
	}
	return r.GetPlanilla(ctx, p.ID)
}

func (r *PostgresRepository) CreateIngreso(ctx context.Context, planillaID int, ingreso *domain.Ingreso) (*domain.Ingreso, error) {
	var ing domain.Ingreso
	err := r.pool.QueryRow(ctx,
		`INSERT INTO ingresos (planilla_id, tipo, monto, comentario) VALUES ($1, $2, $3, $4)
		 RETURNING id, planilla_id, tipo, monto, comentario`,
		planillaID, ingreso.Tipo, ingreso.Monto, ingreso.Comentario,
	).Scan(&ing.ID, &ing.PlanillaID, &ing.Tipo, &ing.Monto, &ing.Comentario)
	if err != nil {
		return nil, err
	}
	return &ing, nil
}

func (r *PostgresRepository) CreateDescuento(ctx context.Context, planillaID int, descuento *domain.Descuento) (*domain.Descuento, error) {
	var desc domain.Descuento
	err := r.pool.QueryRow(ctx,
		`INSERT INTO descuentos (planilla_id, tipo, monto, comentario) VALUES ($1, $2, $3, $4)
		 RETURNING id, planilla_id, tipo, monto, comentario`,
		planillaID, descuento.Tipo, descuento.Monto, descuento.Comentario,
	).Scan(&desc.ID, &desc.PlanillaID, &desc.Tipo, &desc.Monto, &desc.Comentario)
	if err != nil {
		return nil, err
	}
	return &desc, nil
}

func (r *PostgresRepository) DeleteIngresosByPlanilla(ctx context.Context, planillaID int) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM ingresos WHERE planilla_id = $1", planillaID)
	return err
}

func (r *PostgresRepository) DeleteDescuentosByPlanilla(ctx context.Context, planillaID int) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM descuentos WHERE planilla_id = $1", planillaID)
	return err
}