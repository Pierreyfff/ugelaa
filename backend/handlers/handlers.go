package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"planillas-backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func getDB(c *gin.Context) *gorm.DB {
	return c.MustGet("db").(*gorm.DB)
}

func Login(c *gin.Context) {
	db := getDB(c)
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	var usuario models.Usuario
	if err := db.Where("email = ?", input.Email).First(&usuario).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login exitoso",
		"user":    usuario,
	})
}

func RegistrarUsuario(c *gin.Context) {
	db := getDB(c)
	var input models.Usuario

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al encriptar password"})
		return
	}
	input.PasswordHash = string(hash)
	input.CreatedAt = time.Now()

	if err := db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear usuario"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Usuario creado", "user": input})
}

func ListarPersonal(c *gin.Context) {
	db := getDB(c)
	var personal []models.Personal

	search := c.Query("search")
	if search != "" {
		db = db.Where("nombres ILIKE ? OR apellidos ILIKE ? OR dni ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	activo := c.Query("activo")
	if activo == "true" {
		db = db.Where("activo = ?", true)
	} else if activo == "false" {
		db = db.Where("activo = ?", false)
	}

	db.Find(&personal)
	c.JSON(http.StatusOK, personal)
}

func ObtenerPersonal(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var personal models.Personal

	if err := db.First(&personal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Personal no encontrado"})
		return
	}

	c.JSON(http.StatusOK, personal)
}

func CrearPersonal(c *gin.Context) {
	db := getDB(c)
	var personal models.Personal

	if err := c.ShouldBindJSON(&personal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	personal.CreatedAt = time.Now()
	if err := db.Create(&personal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear personal"})
		return
	}

	c.JSON(http.StatusCreated, personal)
}

func ActualizarPersonal(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var personal models.Personal

	if err := db.First(&personal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Personal no encontrado"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := db.Model(&personal).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar"})
		return
	}

	c.JSON(http.StatusOK, personal)
}

func EliminarPersonal(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")

	if err := db.Delete(&models.Personal{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Eliminado correctamente"})
}

func ListarPlanillas(c *gin.Context) {
	db := getDB(c)
	var planillas []models.Planilla

	mes := c.Query("mes")
	anio := c.Query("anio")

	if mes != "" {
		db = db.Where("mes = ?", mes)
	}
	if anio != "" {
		db = db.Where("anio = ?", anio)
	}

	db.Preload("Personal").Find(&planillas)

	for i := range planillas {
		planillas[i].CalculateTotal()
	}

	c.JSON(http.StatusOK, planillas)
}

func ObtenerPlanilla(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var planilla models.Planilla

	if err := db.Preload("Personal").Preload("Ingresos").Preload("Descuentos").First(&planilla, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Planilla no encontrada"})
		return
	}

	planilla.CalculateTotal()
	c.JSON(http.StatusOK, planilla)
}

func CrearPlanilla(c *gin.Context) {
	db := getDB(c)
	var planilla models.Planilla

	if err := c.ShouldBindJSON(&planilla); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	planilla.CreadoEn = time.Now()

	var existing models.Planilla
	if err := db.Where("personal_id = ? AND mes = ? AND anio = ?", planilla.PersonalID, planilla.Mes, planilla.Anio).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Ya existe una planilla para este personal en el período"})
		return
	}

	if err := db.Create(&planilla).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear planilla"})
		return
	}

	c.JSON(http.StatusCreated, planilla)
}

func ActualizarPlanilla(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var planilla models.Planilla

	if err := db.First(&planilla, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Planilla no encontrada"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := db.Model(&planilla).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar"})
		return
	}

	c.JSON(http.StatusOK, planilla)
}

func EliminarPlanilla(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")

	if err := db.Delete(&models.Planilla{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Eliminado correctamente"})
}

func ListarIngresos(c *gin.Context) {
	db := getDB(c)
	planillaID := c.Param("id")
	var ingresos []models.Ingreso

	db.Where("planilla_id = ?", planillaID).Find(&ingresos)
	c.JSON(http.StatusOK, ingresos)
}

func ListarDescuentos(c *gin.Context) {
	db := getDB(c)
	planillaID := c.Param("id")
	var descuentos []models.Descuento

	db.Where("planilla_id = ?", planillaID).Find(&descuentos)
	c.JSON(http.StatusOK, descuentos)
}

func CrearIngreso(c *gin.Context) {
	db := getDB(c)
	var ingreso models.Ingreso

	if err := c.ShouldBindJSON(&ingreso); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := db.Create(&ingreso).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear ingreso"})
		return
	}

	c.JSON(http.StatusCreated, ingreso)
}

func ActualizarIngreso(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var ingreso models.Ingreso

	if err := db.First(&ingreso, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingreso no encontrado"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	db.Model(&ingreso).Updates(input)

	var planilla models.Planilla
	db.First(&planilla, ingreso.PlanillaID)
	db.Model(&planilla).Update("total_haberes", gorm.Expr("COALESCE((SELECT SUM(monto) FROM ingresos WHERE planilla_id = ?), 0)", ingreso.PlanillaID))

	c.JSON(http.StatusOK, ingreso)
}

func EliminarIngreso(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var ingreso models.Ingreso

	if err := db.First(&ingreso, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ingreso no encontrado"})
		return
	}

	planillaID := ingreso.PlanillaID
	db.Delete(&ingreso)

	var planilla models.Planilla
	db.First(&planilla, planillaID)
	db.Model(&planilla).Update("total_haberes", gorm.Expr("COALESCE((SELECT SUM(monto) FROM ingresos WHERE planilla_id = ?), 0)", planillaID))

	c.JSON(http.StatusOK, gin.H{"message": "Eliminado correctamente"})
}

func CrearDescuento(c *gin.Context) {
	db := getDB(c)
	var descuento models.Descuento

	if err := c.ShouldBindJSON(&descuento); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := db.Create(&descuento).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear descuento"})
		return
	}

	c.JSON(http.StatusCreated, descuento)
}

func ActualizarDescuento(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var descuento models.Descuento

	if err := db.First(&descuento, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Descuento no encontrado"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	db.Model(&descuento).Updates(input)

	var planilla models.Planilla
	db.First(&planilla, descuento.PlanillaID)
	db.Model(&planilla).Update("total_descuentos", gorm.Expr("COALESCE((SELECT SUM(monto) FROM descuentos WHERE planilla_id = ?), 0)", descuento.PlanillaID))

	c.JSON(http.StatusOK, descuento)
}

func EliminarDescuento(c *gin.Context) {
	db := getDB(c)
	id := c.Param("id")
	var descuento models.Descuento

	if err := db.First(&descuento, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Descuento no encontrado"})
		return
	}

	planillaID := descuento.PlanillaID
	db.Delete(&descuento)

	var planilla models.Planilla
	db.First(&planilla, planillaID)
	db.Model(&planilla).Update("total_descuentos", gorm.Expr("COALESCE((SELECT SUM(monto) FROM descuentos WHERE planilla_id = ?), 0)", planillaID))

	c.JSON(http.StatusOK, gin.H{"message": "Eliminado correctamente"})
}

func importarData(db *gorm.DB, data *models.DataExcel) (int, int, []string) {
	personalCreados := 0
	planillasCreadas := 0
	warnings := []string{}

	// personalIDs[i] = DB id for data.Personal[i]
	personalIDs := make([]uint, len(data.Personal))

	for i, p := range data.Personal {
		var existing models.Personal
		found := false

		if p.DNI != "" {
			if err := db.Where("dni = ?", p.DNI).First(&existing).Error; err == nil {
				found = true
			}
		}
		if !found && p.Nombres != "" {
			if err := db.Where("nombres = ?", p.Nombres).First(&existing).Error; err == nil {
				found = true
			}
		}

		if found {
			personalIDs[i] = existing.ID
		} else if p.Nombres != "" {
			p.CreatedAt = time.Now()
			if err := db.Create(&p).Error; err == nil {
				personalIDs[i] = p.ID
				personalCreados++
			} else {
				warnings = append(warnings, fmt.Sprintf("No se pudo crear personal '%s': %v", p.Nombres, err))
			}
		} else {
			warnings = append(warnings, fmt.Sprintf("Bloque %d ignorado: sin nombre ni DNI", i+1))
		}
	}

	for i, pl := range data.Planillas {
		if i >= len(personalIDs) || personalIDs[i] == 0 {
			continue
		}
		personalID := personalIDs[i]

		var planilla models.Planilla
		db.Where("personal_id = ? AND mes = ? AND anio = ?", personalID, pl.Mes, pl.Anio).First(&planilla)

		if planilla.ID == 0 {
			planilla = models.Planilla{
				PersonalID: personalID,
				Mes:        int16(pl.Mes),
				Anio:       int16(pl.Anio),
				CreadoEn:   time.Now(),
			}
			db.Create(&planilla)
			planillasCreadas++
		}

		for _, ing := range pl.Ingresos {
			db.Create(&models.Ingreso{PlanillaID: planilla.ID, Tipo: ing.Tipo, Monto: ing.Monto})
		}
		for _, desc := range pl.Descuentos {
			db.Create(&models.Descuento{PlanillaID: planilla.ID, Tipo: desc.Tipo, Monto: desc.Monto})
		}

		// Recalculate totals
		var totalHab, totalDesc float64
		db.Model(&models.Ingreso{}).Where("planilla_id = ?", planilla.ID).
			Select("COALESCE(SUM(monto), 0)").Scan(&totalHab)
		db.Model(&models.Descuento{}).Where("planilla_id = ?", planilla.ID).
			Select("COALESCE(SUM(monto), 0)").Scan(&totalDesc)
		db.Model(&planilla).Updates(map[string]interface{}{
			"total_haberes":    totalHab,
			"total_descuentos": totalDesc,
		})
	}

	return personalCreados, planillasCreadas, warnings
}

func ImportarExcel(c *gin.Context) {
	db := getDB(c)

	// Read optional period override from form fields
	mesOverride := 0
	anioOverride := 0
	if ms := c.PostForm("mes"); ms != "" {
		if v, err := strconv.Atoi(ms); err == nil && v >= 1 && v <= 12 {
			mesOverride = v
		}
	}
	if ay := c.PostForm("anio"); ay != "" {
		if v, err := strconv.Atoi(ay); err == nil && v >= 2000 {
			anioOverride = v
		}
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se pudo obtener el archivo"})
		return
	}

	filename := fmt.Sprintf("uploads/%d_%s", time.Now().Unix(), file.Filename)
	if err := c.SaveUploadedFile(file, filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar archivo: " + err.Error()})
		return
	}

	data, err := ReadExcelFile(filename)
	if err != nil {
		log.Printf("ReadExcelFile error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al leer Excel: " + err.Error()})
		return
	}

	if len(data.Planillas) == 0 && len(data.Personal) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message":           "No se encontraron datos en el archivo. Verifique el formato.",
			"personal_creados":  0,
			"planillas_creadas": 0,
			"personal":          0,
			"planillas":         0,
		})
		return
	}

	// Apply period override: user's selection always wins
	if mesOverride > 0 || anioOverride > 0 {
		for i := range data.Planillas {
			if mesOverride > 0 {
				data.Planillas[i].Mes = mesOverride
			}
			if anioOverride > 0 {
				data.Planillas[i].Anio = anioOverride
			}
		}
	}

	personalCreados, planillasCreadas, warnings := importarData(db, data)
	c.JSON(http.StatusOK, gin.H{
		"message":           "Importación completada",
		"personal_creados":  personalCreados,
		"planillas_creadas": planillasCreadas,
		"personal":          len(data.Personal),
		"planillas":         len(data.Planillas),
		"errores":           warnings,
	})
}

func ImportarJSON(c *gin.Context) {
	db := getDB(c)

	var data models.DataExcel
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	personalCreados, planillasCreadas, warnings := importarData(db, &data)
	c.JSON(http.StatusOK, gin.H{
		"message":           "Importación completada",
		"personal_creados":  personalCreados,
		"planillas_creadas": planillasCreadas,
		"personal":          len(data.Personal),
		"planillas":         len(data.Planillas),
		"errores":           warnings,
	})
}

// ImportarHaberes handles the JSON payload produced by the Python extractor.
// Format: { mes, anio, total_empleados, empleados: [{nombre, cargo, resolucion, codigo, dni, haberes:[{concepto,monto}], descuentos:[{concepto,monto}], ...}] }
func ImportarHaberes(c *gin.Context) {
	db := getDB(c)

	var payload models.HaberesPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if payload.Mes == nil || payload.Anio == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Se requieren los campos mes y anio"})
		return
	}

	mes := *payload.Mes
	anio := *payload.Anio

	if mes < 1 || mes > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mes inválido (debe ser 1-12)"})
		return
	}

	personalCreados := 0
	planillasCreadas := 0
	var warnings []string

	for _, emp := range payload.Empleados {
		var personal models.Personal
		found := false

		// Lookup by DNI first, then by name
		if emp.DNI != nil && *emp.DNI != "" {
			if err := db.Where("dni = ?", *emp.DNI).First(&personal).Error; err == nil {
				found = true
			}
		}
		if !found && emp.Nombre != "" {
			if err := db.Where("nombres = ?", emp.Nombre).First(&personal).Error; err == nil {
				found = true
			}
		}

		if !found {
			if emp.Nombre == "" {
				warnings = append(warnings, "Empleado ignorado: sin nombre ni DNI")
				continue
			}
			personal = models.Personal{
				Nombres:   emp.Nombre,
				Apellidos: "",
				Activo:    true,
				CreatedAt: time.Now(),
			}
			if emp.DNI != nil {
				personal.DNI = *emp.DNI
			}
			if emp.Cargo != nil {
				personal.Puesto = *emp.Cargo
			}
			if emp.Resolucion != nil {
				personal.RD = *emp.Resolucion
			}
			if emp.Codigo != nil {
				personal.UU = *emp.Codigo
			}
			if err := db.Create(&personal).Error; err != nil {
				fmt.Printf("[DEBUG] Error creating personal '%s': %v\n", emp.Nombre, err)
				warnings = append(warnings, fmt.Sprintf("No se pudo crear '%s': %v", emp.Nombre, err))
				continue
			}
			fmt.Printf("[DEBUG] Created personal ID=%d for '%s'\n", personal.ID, emp.Nombre)
			personalCreados++
		} else {
			// Fill in any missing fields
			updates := map[string]interface{}{}
			if personal.DNI == "" && emp.DNI != nil && *emp.DNI != "" {
				updates["dni"] = *emp.DNI
			}
			if personal.Puesto == "" && emp.Cargo != nil && *emp.Cargo != "" {
				updates["puesto"] = *emp.Cargo
			}
			if personal.RD == "" && emp.Resolucion != nil && *emp.Resolucion != "" {
				updates["rd"] = *emp.Resolucion
			}
			if personal.UU == "" && emp.Codigo != nil && *emp.Codigo != "" {
				updates["uu"] = *emp.Codigo
			}
			if len(updates) > 0 {
				db.Model(&personal).Updates(updates)
			}
		}

		// Find or create planilla for this period
		var planilla models.Planilla
		err := db.Where("personal_id = ? AND mes = ? AND anio = ?", personal.ID, mes, anio).First(&planilla).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			warnings = append(warnings, fmt.Sprintf("Error al buscar planilla para '%s': %v", emp.Nombre, err))
			continue
		}

		if planilla.ID == 0 {
			planilla = models.Planilla{
				PersonalID: personal.ID,
				Mes:        int16(mes),
				Anio:       int16(anio),
				CreadoEn:   time.Now(),
			}
			if err := db.Create(&planilla).Error; err != nil {
				fmt.Printf("[DEBUG] Error creating planilla for personal_id=%d: %v\n", personal.ID, err)
				warnings = append(warnings, fmt.Sprintf("Error al crear planilla para '%s': %v", emp.Nombre, err))
				continue
			}
			fmt.Printf("[DEBUG] Created planilla ID=%d for personal_id=%d\n", planilla.ID, personal.ID)
			planillasCreadas++
		}

		if planilla.ID == 0 {
			warnings = append(warnings, fmt.Sprintf("Planilla sin ID válido para '%s', omitiendo ingresos/descuentos", emp.Nombre))
			continue
		}

		// Insert haberes (ingresos)
		for _, h := range emp.Haberes {
			if err := db.Create(&models.Ingreso{PlanillaID: planilla.ID, Tipo: h.Concepto, Monto: h.Monto}).Error; err != nil {
				warnings = append(warnings, fmt.Sprintf("Error al insertar ingreso '%s' para '%s': %v", h.Concepto, emp.Nombre, err))
			}
		}
		// Insert descuentos
		for _, d := range emp.Descuentos {
			if err := db.Create(&models.Descuento{PlanillaID: planilla.ID, Tipo: d.Concepto, Monto: d.Monto}).Error; err != nil {
				warnings = append(warnings, fmt.Sprintf("Error al insertar descuento '%s' para '%s': %v", d.Concepto, emp.Nombre, err))
			}
		}
		// Totals are maintained by DB triggers automatically
	}

	c.JSON(http.StatusOK, gin.H{
		"message":           "Importación completada",
		"personal_creados":  personalCreados,
		"planillas_creadas": planillasCreadas,
		"total_empleados":   len(payload.Empleados),
		"errores":           warnings,
	})
}

func ResumenDashboard(c *gin.Context) {
	db := getDB(c)

	var totalPersonal int64
	db.Model(&models.Personal{}).Where("activo = ?", true).Count(&totalPersonal)

	var totalPlanillas int64
	db.Model(&models.Planilla{}).Count(&totalPlanillas)

	var totalHaberes float64
	db.Model(&models.Planilla{}).Select("COALESCE(SUM(total_haberes), 0)").Scan(&totalHaberes)

	var totalDescuentos float64
	db.Model(&models.Planilla{}).Select("COALESCE(SUM(total_descuentos), 0)").Scan(&totalDescuentos)

	mesActual := int(time.Now().Month())
	anioActual := int(time.Now().Year())

	var planillasMes []models.Planilla
	db.Where("mes = ? AND anio = ?", mesActual, anioActual).Preload("Personal").Find(&planillasMes)

	for i := range planillasMes {
		planillasMes[i].CalculateTotal()
	}

	c.JSON(http.StatusOK, gin.H{
		"total_personal":   totalPersonal,
		"total_planillas":  totalPlanillas,
		"total_haberes":    totalHaberes,
		"total_descuentos": totalDescuentos,
		"total_liquido":    totalHaberes - totalDescuentos,
		"planillas_mes":    planillasMes,
	})
}
