package handlers

import (
	"log"
	"regexp"
	"strconv"
	"strings"
	"time"

	"planillas-backend/models"

	"github.com/xuri/excelize/v2"
)

var mesesMap = map[string]int{
	"enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
	"mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
	"septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

var yearRe = regexp.MustCompile(`20\d{2}`)

// buildMergedMap returns a map cell-name → display-value for every cell in a
// merged range, using the top-left cell's value.
func buildMergedMap(f *excelize.File, sheet string) map[string]string {
	m := make(map[string]string)
	cells, err := f.GetMergeCells(sheet)
	if err != nil {
		return m
	}
	for _, mc := range cells {
		val := mc.GetCellValue()
		startCol, startRow, err1 := excelize.CellNameToCoordinates(mc.GetStartAxis())
		endCol, endRow, err2 := excelize.CellNameToCoordinates(mc.GetEndAxis())
		if err1 != nil || err2 != nil {
			continue
		}
		for r := startRow; r <= endRow; r++ {
			for c := startCol; c <= endCol; c++ {
				name, _ := excelize.CoordinatesToCellName(c, r)
				m[name] = val
			}
		}
	}
	return m
}

// rawCell returns the raw string from the rows slice (0-based indices).
func rawCell(rows [][]string, rIdx, cIdx int) string {
	if rIdx < 0 || rIdx >= len(rows) {
		return ""
	}
	row := rows[rIdx]
	if cIdx < 0 || cIdx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[cIdx])
}

// mergedCell returns the display value for 1-based (col, row), preferring the
// merged-cell map and falling back to the raw rows slice.
func mergedCell(mm map[string]string, rows [][]string, col, row int) string {
	name, _ := excelize.CoordinatesToCellName(col, row)
	if v, ok := mm[name]; ok {
		return strings.TrimSpace(v)
	}
	return rawCell(rows, row-1, col-1)
}

func toFloat(s string) float64 {
	s = strings.TrimSpace(strings.ReplaceAll(s, ",", "."))
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

// classifyInfo categorises an employee-info cell.
// Returns (category, value): "rd" | "uu" | "dni" | "puesto" | "distrito"
func classifyInfo(text string) (string, string) {
	u := strings.ToUpper(strings.TrimSpace(text))
	switch {
	case regexp.MustCompile(`^R\.?D\.?[\s\-/]`).MatchString(u):
		return "rd", text
	case regexp.MustCompile(`^UU[\s\-\d]`).MatchString(u), strings.HasPrefix(u, "UU-"):
		return "uu", text
	case strings.Contains(u, "DNI"):
		digits := regexp.MustCompile(`\d+`).FindString(text)
		return "dni", digits
	case regexp.MustCompile(`^(DISTRITO|DIST\.?)\s*:?\s*`).MatchString(u):
		dist := regexp.MustCompile(`^(DISTRITO|DIST\.?)\s*:?\s*`).ReplaceAllString(text, "")
		if strings.TrimSpace(dist) != "" {
			return "distrito", strings.TrimSpace(dist)
		}
		return "puesto", text
	default:
		return "puesto", text
	}
}

// detectColumns scans up to 15 rows to find the 1-based columns for DETALLE
// and the month-amount column, plus mes and anio.
func detectColumns(rows [][]string, sheetName string) (mes, anio, detailCol, amountCol int) {
	anio = time.Now().Year()
	detailCol = 3 // fallback: column C
	amountCol = 4 // fallback: column D

	maxScan := 15
	if len(rows) < maxScan {
		maxScan = len(rows)
	}

	for rIdx := 0; rIdx < maxScan; rIdx++ {
		for cIdx, cell := range rows[rIdx] {
			lower := strings.ToLower(strings.TrimSpace(cell))
			col1 := cIdx + 1
			if lower == "detalle" {
				detailCol = col1
				continue
			}
			if num, ok := mesesMap[lower]; ok {
				mes = num
				amountCol = col1
				continue
			}
			// Partial month match (e.g. "FEBRERO" -> "feb")
			for mname, mnum := range mesesMap {
				if len(lower) >= 3 && strings.HasPrefix(lower, mname[:3]) {
					mes = mnum
					amountCol = col1
					break
				}
			}
			// Year anywhere in cell
			if match := yearRe.FindString(cell); match != "" {
				if y, e := strconv.Atoi(match); e == nil {
					anio = y
				}
			}
		}
	}

	// Sheet-name year takes priority
	if match := yearRe.FindString(sheetName); match != "" {
		if y, e := strconv.Atoi(match); e == nil {
			anio = y
		}
	}
	return
}

// ReadExcelFile parses a payroll Excel that uses the vertical-block layout:
//
//	Col A   │ Col B           │ Col C   │ Col D
//	────────┼─────────────────┼─────────┼────────
//	HABERES │ Apellidos       │ DETALLE │ FEBRERO
//	(merge) │ Nombres (merge) │ BASICA  │  0.03
//	        │ TRAB. SERV. II  │ DL19990 │ 60.00
//	        │ RD 150-93       │ TPH     │ 19.20
//	        │ uu-01-0-005     │ ...
//	DSCTOS  │                 │ DL20530 │  3.80
//	TOTAL HABERES                       │ 153.92
//	TOTAL DESCUENTOS                    │  76.27
//	TOTAL LIQUIDO                       │  77.65
//
// Multiple employee blocks appear stacked vertically in one sheet.
func ReadExcelFile(filename string) (*models.DataExcel, error) {
	f, err := excelize.OpenFile(filename)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	data := &models.DataExcel{}

	for _, sheet := range f.GetSheetList() {
		rows, err := f.GetRows(sheet)
		if err != nil || len(rows) < 2 {
			continue
		}

		mm := buildMergedMap(f, sheet)
		mes, anio, detailCol, amountCol := detectColumns(rows, sheet)

		// Derive adjacent columns (all 1-based)
		empInfoCol := detailCol - 1
		if empInfoCol < 1 {
			empInfoCol = 2
		}
		seccionCol := empInfoCol - 1
		if seccionCol < 1 {
			seccionCol = 1
		}
		if seccionCol == empInfoCol {
			// they collapsed onto the same; push empInfo right
			empInfoCol = seccionCol + 1
		}

		log.Printf("[excel] sheet=%s mes=%d anio=%d secCol=%d empCol=%d detCol=%d monCol=%d rows=%d",
			sheet, mes, anio, seccionCol, empInfoCol, detailCol, amountCol, len(rows))

		type block struct {
			personal models.Personal
			planilla models.PlanillaImport
		}

		flush := func(cur *block) {
			if cur == nil {
				return
			}
			if cur.personal.Nombres == "" && cur.personal.DNI == "" {
				return
			}
			data.Personal = append(data.Personal, cur.personal)
			data.Planillas = append(data.Planillas, cur.planilla)
		}

		var cur *block
		inSection := "" // "haberes" | "dsctos"
		colegioActual := ""

		for rIdx, row := range rows {
			rowNum := rIdx + 1

			// Use the raw value to detect the start of a new merged section
			rawSec := strings.ToUpper(rawCell(rows, rIdx, seccionCol-1))
			rawEmp := rawCell(rows, rIdx, empInfoCol-1)
			rawDet := rawCell(rows, rIdx, detailCol-1)
			rawMon := rawCell(rows, rIdx, amountCol-1)

			// Detect colegio: a row whose Col B has content (not a section marker)
			// and is immediately followed by a HABERES row
			if rawEmp != "" && rIdx+1 < len(rows) {
				nextSec := strings.ToUpper(rawCell(rows, rIdx+1, seccionCol-1))
				if nextSec == "HABERES" {
					colegioActual = rawEmp
				}
			}

			// Build full-row text from merged values for TOTAL detection
			colCount := len(row)
			if colCount < amountCol {
				colCount = amountCol
			}
			if colCount > 20 {
				colCount = 20
			}
			parts := make([]string, colCount)
			for c := 1; c <= colCount; c++ {
				parts[c-1] = mergedCell(mm, rows, c, rowNum)
			}
			fullRow := strings.ToUpper(strings.Join(parts, " "))

			// ── End-of-block markers ─────────────────────────────────────
			if strings.Contains(fullRow, "TOTAL HABERES") {
				flush(cur)
				cur = nil
				inSection = ""
				continue
			}
			if strings.Contains(fullRow, "TOTAL DESCUENTO") || strings.Contains(fullRow, "TOTAL LIQUIDO") {
				continue
			}

			// ── New HABERES block ────────────────────────────────────────
			if rawSec == "HABERES" {
				flush(cur)
				inSection = "haberes"
				// The employee name is the merged cell value in empInfoCol
				empName := mergedCell(mm, rows, empInfoCol, rowNum)
				cur = &block{
					personal: models.Personal{
						Nombres:  empName,
						Colegio:  colegioActual,
					},
					planilla: models.PlanillaImport{
						Nombres:    empName,
						Mes:        mes,
						Anio:       anio,
						Ingresos:   []models.IngresoImport{},
						Descuentos: []models.DescuentoImport{},
					},
				}
				colegioActual = ""
				// First item may appear on the same row as HABERES
				if rawDet != "" {
					if m := toFloat(rawMon); m > 0 {
						cur.planilla.Ingresos = append(cur.planilla.Ingresos,
							models.IngresoImport{Tipo: rawDet, Monto: m})
					}
				}
				continue
			}

			// ── DSCTOS block ─────────────────────────────────────────────
			if cur != nil && (strings.Contains(rawSec, "DSCTO") || strings.Contains(rawSec, "DESCUENTO")) {
				inSection = "dsctos"
				if rawDet != "" {
					if m := toFloat(rawMon); m > 0 {
						cur.planilla.Descuentos = append(cur.planilla.Descuentos,
							models.DescuentoImport{Tipo: rawDet, Monto: m})
					}
				}
				continue
			}

			if cur == nil {
				continue
			}

			// ── Employee-info column (RD, UU, DNI, distrito, puesto) ────
			if inSection == "haberes" && rawEmp != "" && rawEmp != cur.personal.Nombres {
				cat, val := classifyInfo(rawEmp)
				switch cat {
				case "rd":
					if cur.personal.RD == "" {
						cur.personal.RD = val
					}
				case "uu":
					if cur.personal.UU == "" {
						cur.personal.UU = val
					}
				case "dni":
					if cur.personal.DNI == "" {
						cur.personal.DNI = val
						cur.planilla.DNI = val
					}
				case "distrito":
					if cur.personal.Distrito == "" {
						cur.personal.Distrito = val
					}
				case "puesto":
					// Order: distrito before cargo
					if cur.personal.Distrito == "" {
						cur.personal.Distrito = val
					} else if cur.personal.Puesto == "" {
						cur.personal.Puesto = val
					}
				}
			}

			// ── Line item ────────────────────────────────────────────────
			if inSection != "" && rawDet != "" {
				if m := toFloat(rawMon); m > 0 {
					if inSection == "haberes" {
						cur.planilla.Ingresos = append(cur.planilla.Ingresos,
							models.IngresoImport{Tipo: rawDet, Monto: m})
					} else {
						cur.planilla.Descuentos = append(cur.planilla.Descuentos,
							models.DescuentoImport{Tipo: rawDet, Monto: m})
					}
				}
			}
		}

		// Flush any block not terminated by a TOTAL row
		flush(cur)
	}

	log.Printf("[excel] parsed %d personal, %d planillas from %s",
		len(data.Personal), len(data.Planillas), filename)
	return data, nil
}
