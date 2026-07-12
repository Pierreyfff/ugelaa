package handlers

import (
	"bytes"
	"fmt"
	"math"
	"os"
	"sort"
	"strings"

	"github.com/xuri/excelize/v2"
)

var (
	mesesAbr   = []string{"", "ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"}
	mesesNombre = []string{"", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"}
	descKeywords = []string{
		"AFP", "ONP", "ESSALUD", "SNP", "COMISION", "SEGURO", "SALUD",
		"PRESTAMO", "PRÉSTAMO", "DESCUENTO", "DSCTO", "DESCTO",
		"RETENCION", "RETENCIÓN", "JUDICIAL", "SINDICATO",
		"MULTA", "CAF", "APORTE", "CUOTA", "FONAVI", "IMPUESTO",
		"RENTA", "QUINTA", "ADELANTO",
	}
)

func isDescuento(nombre string) bool {
	upper := strings.ToUpper(strings.NewReplacer(" ", "", "Á", "A", "É", "E", "Í", "I", "Ó", "O", "Ú", "U").Replace(nombre))
	for _, kw := range descKeywords {
		if strings.Contains(upper, kw) {
			return true
		}
	}
	return false
}

type exportPersonalData struct {
	ID          uint   `json:"id"`
	DNI         string `json:"dni"`
	Nombres     string `json:"nombres"`
	Apellidos   string `json:"apellidos"`
	Puesto      string `json:"puesto"`
	RD          string `json:"rd"`
	UU          string `json:"uu"`
	Institucion string `json:"institucion"`
	Distrito    string `json:"distrito"`
}

type exportPlanillaData struct {
	Anio       int16              `json:"anio"`
	Mes        int16              `json:"mes"`
	Ingresos   []exportConcepto   `json:"ingresos"`
	Descuentos []exportConcepto   `json:"descuentos"`
}

type exportConcepto struct {
	Tipo  string  `json:"tipo"`
	Monto float64 `json:"monto"`
}

func setCell(ws *excelize.File, sheet string, row, col int, value interface{}) {
	cellName, err := excelize.CoordinatesToCellName(col, row)
	if err != nil {
		return
	}

	merged, _ := ws.GetMergeCells(sheet)
	for _, mc := range merged {
		startCol, startRow, err1 := excelize.CellNameToCoordinates(mc.GetStartAxis())
		endCol, endRow, err2 := excelize.CellNameToCoordinates(mc.GetEndAxis())
		if err1 != nil || err2 != nil {
			continue
		}
		if row >= startRow && row <= endRow && col >= startCol && col <= endCol {
			if row != startRow || col != startCol {
				srcCell, _ := excelize.CoordinatesToCellName(startCol, startRow)
				styleID, _ := ws.GetCellStyle(sheet, srcCell)
				_ = ws.UnmergeCell(sheet, mc.GetStartAxis(), mc.GetEndAxis())
				for r := startRow; r <= endRow; r++ {
					for c := startCol; c <= endCol; c++ {
						cn, _ := excelize.CoordinatesToCellName(c, r)
						ws.SetCellStyle(sheet, cn, cn, styleID)
					}
				}
			}
			break
		}
	}

	ws.SetCellValue(sheet, cellName, value)
}

func setCellStr(ws *excelize.File, sheet string, row, col int, value string) {
	cn, _ := excelize.CoordinatesToCellName(col, row)
	ws.SetCellStr(sheet, cn, value)
}

func unmergeDataZone(ws *excelize.File, sheet string) {
	merged, _ := ws.GetMergeCells(sheet)
	for _, mc := range merged {
		startCol, startRow, err1 := excelize.CellNameToCoordinates(mc.GetStartAxis())
		endCol, endRow, err2 := excelize.CellNameToCoordinates(mc.GetEndAxis())
		if err1 != nil || err2 != nil {
			continue
		}
		if (startRow >= 9 && startRow <= 40) || (endRow >= 9 && endRow <= 40) {
			ws.UnmergeCell(sheet, mc.GetStartAxis(), mc.GetEndAxis())
		}
		_ = startCol
		_ = endCol
	}
}

func writeAnnualPlanilla(ws *excelize.File, sheet string, year int16, planillas []exportPlanillaData, personal exportPersonalData) {
	fullName := strings.Trim(personal.Apellidos+", "+personal.Nombres, ", ")
	setCell(ws, sheet, 5, 3, fullName)
	setCell(ws, sheet, 7, 3, personal.DNI)
	setCell(ws, sheet, 5, 11, personal.Institucion)
	setCell(ws, sheet, 6, 11, personal.Puesto)
	setCell(ws, sheet, 7, 11, personal.RD)
	setCell(ws, sheet, 8, 11, personal.UU)

	mesesSet := make(map[int16]bool)
	for _, p := range planillas {
		mesesSet[p.Mes] = true
	}
	var mesesConDatos []int16
	for m := range mesesSet {
		mesesConDatos = append(mesesConDatos, m)
	}
	sort.Slice(mesesConDatos, func(i, j int) bool { return mesesConDatos[i] < mesesConDatos[j] })

	var periodoStr string
	if len(mesesConDatos) == 1 {
		periodoStr = fmt.Sprintf("%s %d", mesesNombre[mesesConDatos[0]], year)
	} else {
		periodoStr = fmt.Sprintf("%d", year)
	}
	setCell(ws, sheet, 6, 3, periodoStr)

	setCell(ws, sheet, 9, 1, "DESCRIPCION")
	for m := 1; m <= 12; m++ {
		setCell(ws, sheet, 9, 3+m, mesesAbr[m])
	}

	setCell(ws, sheet, 10, 1, "HABERES")

	haberesData := make(map[string]map[int16]float64)
	descuentosData := make(map[string]map[int16]float64)

	for _, p := range planillas {
		mes := p.Mes
		for _, ing := range p.Ingresos {
			t := strings.TrimSpace(ing.Tipo)
			if t == "" {
				continue
			}
			monto := ing.Monto
			if isDescuento(t) {
				if descuentosData[t] == nil {
					descuentosData[t] = make(map[int16]float64)
				}
				descuentosData[t][mes] += monto
			} else {
				if haberesData[t] == nil {
					haberesData[t] = make(map[int16]float64)
				}
				haberesData[t][mes] += monto
			}
		}
		for _, desc := range p.Descuentos {
			t := strings.TrimSpace(desc.Tipo)
			if t == "" {
				continue
			}
			monto := desc.Monto
			if descuentosData[t] == nil {
				descuentosData[t] = make(map[int16]float64)
			}
			descuentosData[t][mes] += monto
		}
	}

	haberesSorted := sortKeys(haberesData)
	if len(haberesSorted) > 14 {
		haberesSorted = haberesSorted[:14]
	}

	rh := 11
	for _, concepto := range haberesSorted {
		setCell(ws, sheet, rh, 1, concepto)
		for m := 1; m <= 12; m++ {
			setCell(ws, sheet, rh, 3+m, math.Round(haberesData[concepto][int16(m)]*100)/100)
		}
		rh++
	}

	setCell(ws, sheet, 25, 1, "TOTAL HABERES")
	for m := 1; m <= 12; m++ {
		var total float64
		for _, c := range haberesSorted {
			total += haberesData[c][int16(m)]
		}
		setCell(ws, sheet, 25, 3+m, math.Round(total*100)/100)
	}

	setCell(ws, sheet, 26, 1, "DESCUENTOS")
	descSorted := sortKeys(descuentosData)
	if len(descSorted) > 8 {
		descSorted = descSorted[:8]
	}
	for i, concepto := range descSorted {
		row := 27 + i
		setCell(ws, sheet, row, 1, concepto)
		for m := 1; m <= 12; m++ {
			setCell(ws, sheet, row, 3+m, math.Round(descuentosData[concepto][int16(m)]*100)/100)
		}
	}

	setCell(ws, sheet, 35, 1, "TOTAL DESCUENTOS")
	for m := 1; m <= 12; m++ {
		var total float64
		for _, c := range descSorted {
			total += descuentosData[c][int16(m)]
		}
		setCell(ws, sheet, 35, 3+m, math.Round(total*100)/100)
	}

	setCell(ws, sheet, 36, 1, "TOTAL LIQUIDO")
	for m := 1; m <= 12; m++ {
		var th, td float64
		for _, c := range haberesSorted {
			th += haberesData[c][int16(m)]
		}
		for _, c := range descSorted {
			td += descuentosData[c][int16(m)]
		}
		setCell(ws, sheet, 36, 3+m, math.Round((th-td)*100)/100)
	}
}

func sortKeys(m map[string]map[int16]float64) []string {
	var keys []string
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

func generateExportExcel(personal exportPersonalData, planillas []exportPlanillaData, templateData []byte) ([]byte, string, error) {
	wb, err := excelize.OpenReader(bytes.NewReader(templateData))
	if err != nil {
		return nil, "", fmt.Errorf("error abriendo plantilla: %w", err)
	}
	defer wb.Close()

	yearsSet := make(map[int16]bool)
	for _, p := range planillas {
		yearsSet[p.Anio] = true
	}
	var years []int16
	for y := range yearsSet {
		years = append(years, y)
	}
	sort.Slice(years, func(i, j int) bool { return years[i] < years[j] })

	if len(years) == 0 {
		return nil, "", fmt.Errorf("el empleado no tiene planillas registradas")
	}

	firstSheet := wb.GetSheetName(0)
	firstIdx, _ := wb.GetSheetIndex(firstSheet)
	wb.SetSheetName(firstSheet, fmt.Sprintf("%d", years[0]))

	yearIndices := map[int16]int{years[0]: firstIdx}
	yearNames := map[int16]string{years[0]: fmt.Sprintf("%d", years[0])}
	for _, yr := range years[1:] {
		idx, err := wb.NewSheet(fmt.Sprintf("%d", yr))
		if err != nil {
			return nil, "", fmt.Errorf("error creando hoja para año %d: %w", yr, err)
		}
		yearIndices[yr] = idx
		yearNames[yr] = fmt.Sprintf("%d", yr)
	}

	for _, yr := range years {
		sheetName := yearNames[yr]
		if sheetName == "" {
			continue
		}
		if yr != years[0] {
			if err := wb.CopySheet(firstIdx, yearIndices[yr]); err != nil {
				return nil, "", fmt.Errorf("error copiando hoja para año %d: %w", yr, err)
			}
		}
		wb.SetActiveSheet(yearIndices[yr])

		var yearPlanillas []exportPlanillaData
		for _, p := range planillas {
			if p.Anio == yr {
				yearPlanillas = append(yearPlanillas, p)
			}
		}
		writeAnnualPlanilla(wb, sheetName, yr, yearPlanillas, personal)
	}

	var buf bytes.Buffer
	if err := wb.Write(&buf); err != nil {
		return nil, "", fmt.Errorf("error guardando excel: %w", err)
	}

	ape := strings.ReplaceAll(personal.Apellidos, " ", "_")
	nom := strings.ReplaceAll(personal.Nombres, " ", "_")
	filename := fmt.Sprintf("Planilla_%s_%s.xlsx", ape, nom)

	return buf.Bytes(), filename, nil
}

// Embed the template file
var templateFileBytes []byte

func init() {
	data, err := os.ReadFile("plantilla_nueva.xlsx")
	if err == nil {
		templateFileBytes = data
	}
}

func getTemplateBytes() ([]byte, error) {
	if len(templateFileBytes) > 0 {
		return templateFileBytes, nil
	}
	return nil, fmt.Errorf("plantilla no encontrada en el servidor")
}


