package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/planillas/api/domain"
	"github.com/planillas/api/service"
	"github.com/xuri/excelize/v2"
)

type PlanillaHandler struct {
	svc *service.Service
}

func NewPlanillaHandler(svc *service.Service) *PlanillaHandler {
	return &PlanillaHandler{svc: svc}
}

func (h *PlanillaHandler) List(c *gin.Context) {
	personalIDStr := c.Query("personal_id")
	mes, _ := strconv.Atoi(c.Query("mes"))
	anio, _ := strconv.Atoi(c.Query("anio"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	var personalID *int
	if personalIDStr != "" {
		id, err := strconv.Atoi(personalIDStr)
		if err == nil {
			personalID = &id
		}
	}

	planillas, total, err := h.svc.GetPlanillas(c.Request.Context(), personalID, mes, anio, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al obtener planillas"})
		return
	}

	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, domain.PaginatedResponse{
		Data:       planillas,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

func (h *PlanillaHandler) Create(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, domain.ErrorResponse{Error: "no autenticado"})
		return
	}

	var req domain.CreatePlanillaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "datos inválidos", Details: err.Error()})
		return
	}

	planilla, err := h.svc.CreatePlanilla(c.Request.Context(), userID.(int), &req)
	if err != nil {
		if err == service.ErrPersonalNotFound {
			c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "personal no encontrado"})
			return
		}
		if err == service.ErrPlanillaExists {
			c.JSON(http.StatusConflict, domain.ErrorResponse{Error: "ya existe una planilla para este personal en el mes y año especificados"})
			return
		}
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al crear planilla"})
		return
	}

	c.JSON(http.StatusCreated, planilla)
}

func (h *PlanillaHandler) Get(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "ID inválido"})
		return
	}

	planilla, err := h.svc.GetPlanilla(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "planilla no encontrada"})
		return
	}

	c.JSON(http.StatusOK, planilla)
}

func (h *PlanillaHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "ID inválido"})
		return
	}

	var req domain.UpdatePlanillaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "datos inválidos", Details: err.Error()})
		return
	}

	planilla, err := h.svc.UpdatePlanilla(c.Request.Context(), id, &req)
	if err != nil {
		if err == service.ErrPlanillaNotFound {
			c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "planilla no encontrada"})
			return
		}
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, planilla)
}

func (h *PlanillaHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "ID inválido"})
		return
	}

	err = h.svc.DeletePlanilla(c.Request.Context(), id)
	if err != nil {
		if err == service.ErrPlanillaNotFound {
			c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "planilla no encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al eliminar"})
		return
	}

	c.JSON(http.StatusOK, domain.SuccessResponse{Message: "planilla eliminada"})
}

func (h *PlanillaHandler) Prefill(c *gin.Context) {
	personalID, err := strconv.Atoi(c.Query("personal_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "personal_id requerido"})
		return
	}

	mesStr := c.Query("mes")
	anioStr := c.Query("anio")

	if mesStr == "" || anioStr == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "mes y año son requeridos"})
		return
	}

	mes, err := strconv.Atoi(mesStr)
	if err != nil || mes < 1 || mes > 12 {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "mes inválido (1-12)"})
		return
	}

	anio, err := strconv.Atoi(anioStr)
	if err != nil || anio < 2000 {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "año inválido (>=2000)"})
		return
	}

	prevPlanilla, err := h.svc.GetPreviousPlanilla(c.Request.Context(), personalID, mes, anio)
	if err != nil {
		c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "no existe planilla anterior"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "planilla anterior cargada como base",
		"planilla":       prevPlanilla,
		"ingresos":       prevPlanilla.Ingresos,
		"descuentos":     prevPlanilla.Descuentos,
		"total_haberes":  prevPlanilla.TotalHaberes,
		"total_descuentos": prevPlanilla.TotalDescuentos,
	})
}

var MESES_ES = []string{"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"}

func (h *PlanillaHandler) ExportExcel(c *gin.Context) {
	personalIDStr := c.Query("personal_id")
	mesStr := c.Query("mes")
	anioStr := c.Query("anio")

	if personalIDStr == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "Debe seleccionar un trabajador"})
		return
	}
	if mesStr == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "Debe seleccionar el mes"})
		return
	}
	if anioStr == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "Debe seleccionar el año"})
		return
	}

	mes, err := strconv.Atoi(mesStr)
	if err != nil || mes < 1 || mes > 12 {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "Mes inválido"})
		return
	}

	anio, err := strconv.Atoi(anioStr)
	if err != nil || anio < 2000 {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "Año inválido"})
		return
	}

	personalID, err := strconv.Atoi(personalIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "ID de trabajador inválido"})
		return
	}

	personal, err := h.svc.GetPersonal(c.Request.Context(), personalID)
	if err != nil {
		c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "Trabajador no encontrado"})
		return
	}

	planilla, err := h.svc.GetPlanillaByPersonalAndMonth(c.Request.Context(), personalID, mes, anio)
	hasPlanilla := err == nil
	if hasPlanilla {
		planilla.Personal = personal
	}

	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Boleta_Pago")

	headerStyleBlue, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 14, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#1E40AF"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	subHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11, Color: "#1E40AF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#DBEAFE"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	moneyStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt: 2,
		Alignment: &excelize.Alignment{Horizontal: "right"},
	})
	boldStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
	})
	normalStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 11},
	})

	f.SetColWidth("Boleta_Pago", "A", "A", 25)
	f.SetColWidth("Boleta_Pago", "B", "B", 15)
	f.SetColWidth("Boleta_Pago", "C", "C", 30)

	row := 1
	f.MergeCell("Boleta_Pago", "A"+strconv.Itoa(row), "C"+strconv.Itoa(row))
	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "BOLETA DE PAGO - "+MESES_ES[mes-1]+" "+strconv.Itoa(anio))
	f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "C"+strconv.Itoa(row), headerStyleBlue)
	row += 2

	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "DATOS DEL TRABAJADOR")
	f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "A"+strconv.Itoa(row), boldStyle)
	row++

	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "DNI:")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), personal.DNI)
	f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), normalStyle)
	row++
	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "APELLIDOS Y NOMBRES:")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), personal.Apellidos+", "+personal.Nombres)
	f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), boldStyle)
	row++
	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "PUESTO:")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), personal.Puesto)
	f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), normalStyle)
	row++
	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "R.D.:")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), personal.RD)
	f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), normalStyle)
	row++
	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "U.U.:")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), personal.UU)
	f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), normalStyle)
	row += 2

	if !hasPlanilla {
		f.MergeCell("Boleta_Pago", "A"+strconv.Itoa(row), "C"+strconv.Itoa(row))
		f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "⚠ NO EXISTE PLANILLA REGISTRADA PARA ESTE PERIODO")
		warnStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true, Size: 12, Color: "#DC2626"},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"#FEE2E2"}, Pattern: 1},
		})
		f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "C"+strconv.Itoa(row), warnStyle)
		row++
		row++
	}

	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "CONCEPTO")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), "MONTO")
	f.SetCellValue("Boleta_Pago", "C"+strconv.Itoa(row), "OBSERVACIÓN")
	f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "C"+strconv.Itoa(row), subHeaderStyle)
	row++

	totalIngresos := 0.0
	if hasPlanilla {
		if len(planilla.Ingresos) > 0 {
			for _, ing := range planilla.Ingresos {
				f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), ing.Tipo)
				f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), ing.Monto)
				f.SetCellValue("Boleta_Pago", "C"+strconv.Itoa(row), ing.Comentario)
				f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), moneyStyle)
				totalIngresos += ing.Monto
				row++
			}
		} else {
			totalIngresos = planilla.TotalHaberes
		}
	}

	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "TOTAL INGRESOS")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), totalIngresos)
	f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "B"+strconv.Itoa(row), boldStyle)
	f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), moneyStyle)
	row += 2

	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "CONCEPTO")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), "MONTO")
	f.SetCellValue("Boleta_Pago", "C"+strconv.Itoa(row), "OBSERVACIÓN")
	f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "C"+strconv.Itoa(row), subHeaderStyle)
	row++

	totalDescuentos := 0.0
	if hasPlanilla {
		if len(planilla.Descuentos) > 0 {
			for _, desc := range planilla.Descuentos {
				f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), desc.Tipo)
				f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), desc.Monto)
				f.SetCellValue("Boleta_Pago", "C"+strconv.Itoa(row), desc.Comentario)
				f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), moneyStyle)
				totalDescuentos += desc.Monto
				row++
			}
		} else {
			totalDescuentos = planilla.TotalDescuentos
		}
	}

	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), "TOTAL DESCUENTOS")
	f.SetCellValue("Boleta_Pago", "B"+strconv.Itoa(row), totalDescuentos)
	f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "B"+strconv.Itoa(row), boldStyle)
	f.SetCellStyle("Boleta_Pago", "B"+strconv.Itoa(row), "B"+strconv.Itoa(row), moneyStyle)
	row += 2

	liquido := totalIngresos - totalDescuentos
	liquidoStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 12, Color: "#059669"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#D1FAE5"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.MergeCell("Boleta_Pago", "A"+strconv.Itoa(row), "B"+strconv.Itoa(row))
	f.SetCellValue("Boleta_Pago", "A"+strconv.Itoa(row), fmt.Sprintf("LÍQUIDO A PAGAR: S/ %.2f", liquido))
	f.SetCellStyle("Boleta_Pago", "A"+strconv.Itoa(row), "C"+strconv.Itoa(row), liquidoStyle)

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	filename := "Boleta_" + personal.Apellidos + "_" + personal.Nombres + "_" + MESES_ES[mes-1] + "_" + strconv.Itoa(anio)
	c.Header("Content-Disposition", "attachment; filename="+filename+".xlsx")

	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "Error al generar Excel"})
	}
}