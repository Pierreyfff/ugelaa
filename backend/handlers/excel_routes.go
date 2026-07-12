package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"planillas-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func ProcessExcel(c *gin.Context) {
	start := time.Now()
	db := getDB(c)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se encontró archivo"})
		return
	}

	filename := file.Filename
	if !strings.HasSuffix(strings.ToLower(filename), ".xlsx") && !strings.HasSuffix(strings.ToLower(filename), ".xls") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se aceptan archivos Excel (.xlsx, .xls)"})
		return
	}

	mesStr := c.PostForm("mes")
	anioStr := c.PostForm("anio")
	mes, err := strconv.Atoi(mesStr)
	if err != nil || mes < 1 || mes > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mes inválido (debe ser 1-12)"})
		return
	}
	anio, err := strconv.Atoi(anioStr)
	if err != nil || anio < 2000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Año inválido"})
		return
	}

	editsStr := c.PostForm("edits")
	var edits []struct {
		Idx    int    `json:"idx"`
		DNI    string `json:"dni"`
		Nombre string `json:"nombre"`
	}
	if editsStr != "" {
		json.Unmarshal([]byte(editsStr), &edits)
	}

	tmpPath := fmt.Sprintf("uploads/%d_%s", time.Now().UnixNano(), file.Filename)
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar archivo: " + err.Error()})
		return
	}
	defer os.Remove(tmpPath)

	log.Printf("[process] leyendo Excel...")
	t1 := time.Now()
	empleados, err := extractEmployees(tmpPath)
	if err != nil {
		log.Printf("extractEmployees error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al leer Excel: " + err.Error()})
		return
	}
	log.Printf("[process] extractEmployees: %d empleados en %v", len(empleados), time.Since(t1))

	for _, edit := range edits {
		if edit.Idx >= 0 && edit.Idx < len(empleados) {
			if edit.DNI != "" {
				empleados[edit.Idx].DNI = edit.DNI
			}
			if edit.Nombre != "" {
				empleados[edit.Idx].Nombre = edit.Nombre
			}
		}
	}

	totalEncontrados := len(empleados)
	t2 := time.Now()
	analisis := analyzeDuplicates(empleados)
	log.Printf("[process] análisis: %d duplicados en %v", len(analisis.DNIsDuplicados), time.Since(t2))

	exactosSet := make(map[int]bool)
	for _, idx := range analisis.ExactosIndices {
		exactosSet[idx] = true
	}
	var empleadosFiltrados []extractedEmployee
	for i, emp := range empleados {
		if !exactosSet[i] {
			empleadosFiltrados = append(empleadosFiltrados, emp)
		}
	}
	planillasCount := len(empleadosFiltrados)
	montoTotal := calculateTotalAmount(empleadosFiltrados)
	log.Printf("[process] empleados a importar: %d", planillasCount)

	t3 := time.Now()
	var (
		personalCreados, personalActualizados, planillasCreadas int
		duplicados, warnings []string
	)
	personalCreados, personalActualizados, planillasCreadas, duplicados, warnings = importarEmpleados(db, mes, anio, empleadosFiltrados)
	log.Printf("[process] importarEmpleados: %d creados, %d actualizados, %d planillas en %v",
		personalCreados, personalActualizados, planillasCreadas, time.Since(t3))
	if len(warnings) > 0 {
		log.Printf("[process] warnings: %v", warnings)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":              "Excel procesado correctamente",
		"personal_creados":     personalCreados,
		"planillas_creadas":    planillasCreadas,
		"personal":             totalEncontrados,
		"planillas":            planillasCount,
		"exactos":              analisis.Exactos,
		"errores":              warnings,
		"personal_actualizados": personalActualizados,
		"dnis_duplicados":      analisis.DNIsDuplicados,
		"nombres_duplicados":   analisis.NombresDuplicados,
		"exactos_indices":      analisis.ExactosIndices,
		"monto_total":          montoTotal,
		"duplicados":           duplicados,
	})
	log.Printf("[process] total: %v", time.Since(start))
}

func ValidateExcel(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se encontró archivo"})
		return
	}

	filename := file.Filename
	if !strings.HasSuffix(strings.ToLower(filename), ".xlsx") && !strings.HasSuffix(strings.ToLower(filename), ".xls") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se aceptan archivos Excel (.xlsx, .xls)"})
		return
	}

	tmpPath := fmt.Sprintf("uploads/%d_%s", time.Now().UnixNano(), file.Filename)
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar archivo: " + err.Error()})
		return
	}
	defer os.Remove(tmpPath)

	empleados, err := extractEmployees(tmpPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": err.Error()})
		return
	}

	editsStr := c.PostForm("edits")
	if editsStr != "" {
		var edits []struct {
			Idx    int    `json:"idx"`
			DNI    string `json:"dni"`
			Nombre string `json:"nombre"`
		}
		json.Unmarshal([]byte(editsStr), &edits)
		for _, edit := range edits {
			if edit.Idx >= 0 && edit.Idx < len(empleados) {
				if edit.DNI != "" {
					empleados[edit.Idx].DNI = edit.DNI
				}
				if edit.Nombre != "" {
					empleados[edit.Idx].Nombre = edit.Nombre
				}
			}
		}
	}

	total := len(empleados)
	preview := empleados
	if len(preview) > 5 {
		preview = preview[:5]
	}
	analisis := analyzeDuplicates(empleados)
	exactosSet := make(map[int]bool)
	for _, idx := range analisis.ExactosIndices {
		exactosSet[idx] = true
	}
	var filtrados []extractedEmployee
	for i, emp := range empleados {
		if !exactosSet[i] {
			filtrados = append(filtrados, emp)
		}
	}
	montoTotal := calculateTotalAmount(filtrados)

	c.JSON(http.StatusOK, gin.H{
		"valid":              true,
		"total_empleados":    total,
		"preview":            preview,
		"dnis_duplicados":    analisis.DNIsDuplicados,
		"nombres_duplicados": analisis.NombresDuplicados,
		"exactos":            analisis.Exactos,
		"exactos_indices":    analisis.ExactosIndices,
		"a_importar":         total - analisis.Exactos,
		"monto_total":        montoTotal,
	})
}

func ExportExcel(c *gin.Context) {
	db := getDB(c)

	var input struct {
		PersonalID uint `json:"personal_id" binding:"required"`
		Mes        int  `json:"mes"`
		Anio       int  `json:"anio"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Se requiere personal_id"})
		return
	}

	var personal models.Personal
	if err := db.First(&personal, input.PersonalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Personal no encontrado"})
		return
	}

	baseQuery := db.Model(&models.Planilla{}).Preload("Ingresos").Preload("Descuentos")
	baseQuery = baseQuery.Where("personal_id = ?", personal.ID)
	if input.Mes > 0 && input.Mes <= 12 {
		baseQuery = baseQuery.Where("mes = ?", input.Mes)
	}
	if input.Anio >= 1900 {
		baseQuery = baseQuery.Where("anio = ?", input.Anio)
	}

	var planillas []models.Planilla
	baseQuery.Order("anio DESC, mes DESC").Find(&planillas)

	if len(planillas) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "El empleado no tiene planillas registradas"})
		return
	}

	templateBytes, err := getTemplateBytes()
	if err != nil {
		log.Printf("template error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Plantilla no encontrada en el servidor"})
		return
	}

	expPersonal := exportPersonalData{
		ID:          personal.ID,
		DNI:         personal.DNI,
		Nombres:     personal.Nombres,
		Apellidos:   personal.Apellidos,
		Puesto:      personal.Puesto,
		RD:          personal.RD,
		UU:          personal.UU,
		Institucion: personal.Institucion,
		Distrito:    personal.Distrito,
	}

	var expPlanillas []exportPlanillaData
	for _, p := range planillas {
		var ingresos []exportConcepto
		for _, ing := range p.Ingresos {
			ingresos = append(ingresos, exportConcepto{Tipo: ing.Tipo, Monto: ing.Monto})
		}
		var descuentos []exportConcepto
		for _, desc := range p.Descuentos {
			descuentos = append(descuentos, exportConcepto{Tipo: desc.Tipo, Monto: desc.Monto})
		}
		expPlanillas = append(expPlanillas, exportPlanillaData{
			Anio:       p.Anio,
			Mes:        p.Mes,
			Ingresos:   ingresos,
			Descuentos: descuentos,
		})
	}

	excelData, filename, err := generateExportExcel(expPersonal, expPlanillas, templateBytes)
	if err != nil {
		log.Printf("export error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al generar el Excel: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelData)
}

type empEntry struct {
	emp       extractedEmployee
	personal  *models.Personal
	isNew     bool
}

func normalizeKey(s string) string {
	return strings.Join(strings.Fields(strings.ToLower(strings.TrimSpace(s))), " ")
}

func importarEmpleados(db *gorm.DB, mes, anio int, empleados []extractedEmployee) (personalCreados, personalActualizados, planillasCreadas int, duplicados []string, warnings []string) {
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var count int64
	tx.Model(&models.Planilla{}).Where("mes = ? AND anio = ?", mes, anio).Limit(1).Count(&count)
	if count > 0 {
		tx.Rollback()
		warnings = append(warnings, fmt.Sprintf("Este mes y año ya fue importado antes: %d/%d", mes, anio))
		return
	}

	// ── Pre-load all existing personal ────────────────────────────────────
	var allPersonal []models.Personal
	tx.Find(&allPersonal)
	log.Printf("[importar] personal existentes en BD: %d", len(allPersonal))

	byDNI := make(map[string]*models.Personal, len(allPersonal))
	byName := make(map[string]*models.Personal, len(allPersonal))
	for i := range allPersonal {
		p := &allPersonal[i]
		if p.DNI != "" {
			byDNI[p.DNI] = p
		}
		full := normalizeKey(p.Apellidos + " " + p.Nombres)
		byName[full] = p
	}

	// ── Classify employees: new personal vs existing ──────────────────────
	var entries []empEntry         // all employees (new + existing) in order
	var newPersonals []models.Personal // batch of new personal records
	newEmpIdx := make(map[int]int) // entry index → position in newPersonals

	for _, emp := range empleados {
		if emp.Nombre == "" {
			warnings = append(warnings, "Empleado ignorado: sin nombre")
			continue
		}

		var match *models.Personal
		skip := false

		// 1) Match by DNI
		if emp.DNI != "" {
			if p, ok := byDNI[emp.DNI]; ok {
				dbName := normalizeKey(p.Apellidos + " " + p.Nombres)
				empName := normalizeKey(emp.Nombre)
				if dbName == empName {
					match = p
				} else {
					match = p
					warnings = append(warnings,
						fmt.Sprintf("DNI %s: nombre en Excel '%s' difiere de BD '%s'. Se usó el registro existente.",
							emp.DNI, emp.Nombre, p.Apellidos+" "+p.Nombres))
				}
			}
		}

		// 2) Match by name (only if no DNI match yet, and only if personal not already used)
		if match == nil && emp.Nombre != "" {
			nameKey := normalizeKey(emp.Nombre)
			if p, ok := byName[nameKey]; ok {
				match = p
			}
		}

		if skip {
			continue
		}

		if match == nil {
			nameParts := splitName(emp.Nombre)
			np := models.Personal{
				Nombres:   nameParts.nombres,
				Apellidos: nameParts.apellidos,
				CreatedAt: time.Now(),
			}
			if emp.DNI != "" {
				np.DNI = emp.DNI
			}
			if emp.Cargo != "" {
				np.Puesto = emp.Cargo
			}
			if emp.Resolucion != "" {
				np.RD = emp.Resolucion
			}
			if emp.Codigo != "" {
				np.UU = emp.Codigo
			}
			if emp.Institucion != "" {
				np.Institucion = emp.Institucion
			}
			if emp.Distrito != "" {
				np.Distrito = emp.Distrito
			}
			newEmpIdx[len(entries)] = len(newPersonals)
			newPersonals = append(newPersonals, np)
			entries = append(entries, empEntry{emp: emp, isNew: true})
		} else {
			// Update existing personal with any empty fields
			updates := map[string]interface{}{}
			if emp.DNI != "" && match.DNI == "" {
				updates["dni"] = emp.DNI
			}
			if emp.Cargo != "" && match.Puesto == "" {
				updates["puesto"] = emp.Cargo
			}
			if emp.Resolucion != "" && match.RD == "" {
				updates["rd"] = emp.Resolucion
			}
			if emp.Codigo != "" && match.UU == "" {
				updates["uu"] = emp.Codigo
			}
			if emp.Institucion != "" && match.Institucion == "" {
				updates["institucion"] = emp.Institucion
			}
			if emp.Distrito != "" && match.Distrito == "" {
				updates["distrito"] = emp.Distrito
			}
			if len(updates) > 0 {
				if err := tx.Model(match).Updates(updates).Error; err != nil {
					tx.Rollback()
					warnings = append(warnings, fmt.Sprintf("Error al actualizar personal '%s': %v", emp.Nombre, err))
					return
				}
				personalActualizados++
			}
			entries = append(entries, empEntry{emp: emp, personal: match, isNew: false})
		}
	}

	log.Printf("[importar] empleados a procesar: %d, nuevos: %d, existentes: %d, duplicados: %d",
		len(empleados), len(newPersonals), len(entries)-len(newPersonals), len(duplicados))

	// ── Batch INSERT new personal records ────────────────────────────────
	if len(newPersonals) > 0 {
		saved := make([]models.Personal, len(newPersonals))
		copy(saved, newPersonals)
		log.Printf("[importar] insertando %d personales en batch...", len(newPersonals))
		if err := tx.CreateInBatches(saved, 200).Error; err != nil {
			tx.Rollback()
			warnings = append(warnings, fmt.Sprintf("Error al crear personal: %v", err))
			return
		}
		// Link back to entries
		for eIdx, npIdx := range newEmpIdx {
			entries[eIdx].personal = &saved[npIdx]
		}
		personalCreados = len(newPersonals)
	}

	// ── Batch INSERT planillas ───────────────────────────────────────────
	type planData struct {
		planilla   *models.Planilla
		haberes    []conceptoItem
		descuentos []conceptoItem
		entryIdx   int
	}

	// ── Agrupar entries por personal_id para evitar duplicados ──────────
	type groupedEntry struct {
		personalID uint
		haberes    []conceptoItem
		descuentos []conceptoItem
	}
	grouped := make(map[uint]*groupedEntry)
	groupOrder := make([]uint, 0, len(entries))
	for _, e := range entries {
		pid := e.personal.ID
		if _, exists := grouped[pid]; !exists {
			grouped[pid] = &groupedEntry{personalID: pid}
			groupOrder = append(groupOrder, pid)
		}
		grouped[pid].haberes = append(grouped[pid].haberes, e.emp.Haberes...)
		grouped[pid].descuentos = append(grouped[pid].descuentos, e.emp.Descuentos...)
	}
	if len(entries) > len(grouped) {
		warnings = append(warnings, fmt.Sprintf("Se agruparon %d entradas duplicadas en %d personales", len(entries)-len(grouped), len(grouped)))
	}

	var planRecords []models.Planilla
	var planEntries []planData

	for _, pid := range groupOrder {
		planRecords = append(planRecords, models.Planilla{
			PersonalID: pid,
			Mes:        int16(mes),
			Anio:       int16(anio),
			CreadoEn:   time.Now(),
		})
	}
	if len(planRecords) > 0 {
		savedPlan := make([]models.Planilla, len(planRecords))
		copy(savedPlan, planRecords)
		log.Printf("[importar] insertando %d planillas en batch...", len(planRecords))
		if err := tx.CreateInBatches(savedPlan, 200).Error; err != nil {
			tx.Rollback()
			warnings = append(warnings, fmt.Sprintf("Error al crear planillas: %v", err))
			return
		}
		planillasCreadas = len(planRecords)
		for i, pid := range groupOrder {
			planEntries = append(planEntries, planData{
				planilla:   &savedPlan[i],
				haberes:    grouped[pid].haberes,
				descuentos: grouped[pid].descuentos,
				entryIdx:   i,
			})
		}
	}

	// ── Batch INSERT ingresos ────────────────────────────────────────────
	type ingBatch struct {
		Ingresos   []models.Ingreso
		Descuentos []models.Descuento
	}

	var allIngresos []models.Ingreso
	var allDescuentos []models.Descuento

	for _, pe := range planEntries {
		pid := pe.planilla.ID
		for _, h := range pe.haberes {
			allIngresos = append(allIngresos, models.Ingreso{
				PlanillaID: pid,
				Tipo:       h.Concepto,
				Monto:      h.Monto,
			})
		}
		for _, d := range pe.descuentos {
			allDescuentos = append(allDescuentos, models.Descuento{
				PlanillaID: pid,
				Tipo:       d.Concepto,
				Monto:      d.Monto,
			})
		}
	}

	if len(allIngresos) > 0 {
		log.Printf("[importar] insertando %d ingresos en batch...", len(allIngresos))
		if err := tx.CreateInBatches(allIngresos, 500).Error; err != nil {
			tx.Rollback()
			warnings = append(warnings, fmt.Sprintf("Error al insertar ingresos: %v", err))
			return
		}
	}
	if len(allDescuentos) > 0 {
		log.Printf("[importar] insertando %d descuentos en batch...", len(allDescuentos))
		if err := tx.CreateInBatches(allDescuentos, 500).Error; err != nil {
			tx.Rollback()
			warnings = append(warnings, fmt.Sprintf("Error al insertar descuentos: %v", err))
			return
		}
	}

	// ── UPDATE totals (chunked VALUES batch) ────────────────────────────
	log.Printf("[importar] actualizando totales de %d planillas en batch...", len(planEntries))
	type totalRow struct {
		ID        uint
		TotalHab  float64
		TotalDesc float64
		TotalLiq  float64
	}
	totals := make([]totalRow, 0, len(planEntries))
	for _, pe := range planEntries {
		var th, td float64
		for _, h := range pe.haberes { th += h.Monto }
		for _, d := range pe.descuentos { td += d.Monto }
		totals = append(totals, totalRow{ID: pe.planilla.ID, TotalHab: th, TotalDesc: td, TotalLiq: th - td})
	}
	if len(totals) > 0 {
		log.Printf("[importar] debug: primera planilla ID=%d totals=(%.2f,%.2f,%.2f) ultima ID=%d",
			totals[0].ID, totals[0].TotalHab, totals[0].TotalDesc, totals[0].TotalLiq,
			totals[len(totals)-1].ID)
	}
	const updateChunkSize = 5000
	for i := 0; i < len(totals); i += updateChunkSize {
		end := i + updateChunkSize
		if end > len(totals) { end = len(totals) }
		chunk := totals[i:end]

		var placeholders []string
		var args []interface{}
		for _, t := range chunk {
			placeholders = append(placeholders, "(?::int8,?::numeric,?::numeric,?::numeric)")
			args = append(args, t.ID, t.TotalHab, t.TotalDesc, t.TotalLiq)
		}
		query := fmt.Sprintf(`UPDATE planilla p SET
			total_haberes = v.total_haberes,
			total_descuentos = v.total_descuentos,
			total_liquido = v.total_liquido
		FROM (VALUES %s) AS v(id, total_haberes, total_descuentos, total_liquido)
		WHERE p.id = v.id`, strings.Join(placeholders, ","))
		res := tx.Exec(query, args...)
		if res.Error != nil {
			tx.Rollback()
			warnings = append(warnings, fmt.Sprintf("Error al actualizar totales (lote %d): %v", i/updateChunkSize+1, res.Error))
			return
		}
		log.Printf("[importar] lotes %d-%d: %d filas actualizadas", i+1, end, res.RowsAffected)
	}

	log.Printf("[importar] commit...")
	tx.Commit()
	log.Printf("[importar] importación completada exitosamente")
	return
}


