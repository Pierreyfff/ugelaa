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

// normalizeDistrito normalizes a district name: uppercase and replace Ñ→N.
func normalizeDistrito(s string) string {
	return strings.ToUpper(strings.NewReplacer("Ñ", "N").Replace(s))
}

// caneteDistricts contains known districts of Cañete province for identification.
var caneteDistricts = map[string]bool{
	"SAN VICENTE": true, "SAN VICENTE DE CAÑETE": true,
	"SAN VICENTE CAÑETE": true, "SAN VICENTE CANETE": true,
	"CANETE": true,
	"IMPERIAL": true, "NUEVO IMPERIAL": true,
	"NVO IMPERIAL": true, "NVO. IMPERIAL": true,
	"LUNAHUANA": true, "QUILMANA": true, "ZUNIGA": true,
	"PACARAN": true, "COAYLLO": true,
	"SANTA CRUZ DE FLORES": true, "SANTA CRUZ": true,
	"CHILCA": true, "MALA": true, "ASIA": true, "CERRO AZUL": true,
	"SAN LUIS": true, "CALANGO": true, "SAN ANTONIO": true,
}

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
// Returns (category, value): "rd" | "uu" | "dni" | "cargo" | "puesto"
func classifyInfo(text string) (string, string) {
	u := strings.ToUpper(strings.TrimSpace(text))
	switch {
	case regexp.MustCompile(`^R\.?D\.?[\s\-/]`).MatchString(u):
		return "rd", text
	case regexp.MustCompile(`^[IU]U[\s\-\d]`).MatchString(u), strings.HasPrefix(u, "UU-"), strings.HasPrefix(u, "IU-"):
		return "uu", text
	case strings.Contains(u, "DNI"):
		digits := regexp.MustCompile(`\d+`).FindString(text)
		return "dni", digits
	case strings.Contains(u, ".") ||
		regexp.MustCompile(
			`^(PROF|AUX|TRAB|SERV|D\d|AUXILIAR|DOCENTE|DIRECTOR|JEFE|COORDINADOR|` +
				`SUB\s+DIRECTOR|PRACTICANTE|APOYO|ESPECIALISTA|TECNICO|ADMINISTRATIVO)`,
		).MatchString(u):
		return "cargo", text
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

// cargoPatternRe matches common cargo prefixes (used in post-processing).
var cargoPatternRe = regexp.MustCompile(
	`(?i)^(?:PROF|AUX|TRAB|SERV|D\d|AUXILIAR|DOCENTE|DIRECTOR|JEFE|COORDINADOR|` +
		`SUB\s+DIRECTOR|PRACTICANTE|APOYO|ESPECIALISTA|TECNICO|ADMINISTRATIVO)`,
)

// scanHeader scans header rows before the first HABERES to find global
// institution name and district.
// Returns (institucion, distrito).
func scanHeader(rows [][]string, empInfoCol int) (string, string) {
	institucion := ""
	distrito := ""
	maxScan := 30
	if len(rows) < maxScan {
		maxScan = len(rows)
	}

	for i := 0; i < maxScan; i++ {
		a := strings.ToUpper(strings.TrimSpace(rawCell(rows, i, 0)))
		b := strings.TrimSpace(rawCell(rows, i, empInfoCol-1))
		bUpper := strings.ToUpper(b)

		if a == "HABERES" && b != "" {
			break
		}

		// ── District from keyword ──────────────────────────────────────
		distritoKeywords := []struct{ src, col string }{
			{a, "A"}, {bUpper, "B"},
		}
		for _, dk := range distritoKeywords {
			if strings.Contains(dk.src, "DISTRITO") {
				re := regexp.MustCompile(`(?i)DISTRITO\s*:?\s*(.+)`)
				if m := re.FindStringSubmatch(dk.src); len(m) > 1 && strings.TrimSpace(m[1]) != "" {
					distrito = strings.ToUpper(strings.TrimSpace(m[1]))
				} else if b != "" && distrito == "" && dk.col == "A" {
					distrito = bUpper
				}
			}
		}

		// ── Institution from keyword ───────────────────────────────────
		if regexp.MustCompile(`(?i)(?:INSTITUCION|I\.?\s*E\.?\s*|COLEGIO|ESCUELA)`).MatchString(a) {
			re := regexp.MustCompile(`(?i)(?:INSTITUCION|I\.?\s*E\.?|COLEGIO|ESCUELA)\s*[:\-]?\s*(.+)`)
			if m := re.FindStringSubmatch(a); len(m) > 1 && strings.TrimSpace(m[1]) != "" {
				institucion = strings.TrimSpace(m[1])
			} else if b != "" && institucion == "" {
				institucion = b
			}
		} else if regexp.MustCompile(`(?i)(?:INSTITUCION|I\.?\s*E\.?\s*|COLEGIO|ESCUELA)`).MatchString(bUpper) {
			re := regexp.MustCompile(`(?i)(?:INSTITUCION|I\.?\s*E\.?|COLEGIO|ESCUELA)\s*[:\-]?\s*(.+)`)
			if m := re.FindStringSubmatch(bUpper); len(m) > 1 && strings.TrimSpace(m[1]) != "" {
				institucion = strings.TrimSpace(m[1])
			}
		}

		// ── Fallback: plain Col B value ────────────────────────────────
		if b != "" {
			if distrito == "" && caneteDistricts[bUpper] {
				distrito = bUpper
			} else if institucion == "" {
				ignore := bUpper == "HABERES" || bUpper == "DSCTOS" ||
					bUpper == "TOTAL HABERES" || bUpper == "TOTAL DESCUENTOS" || bUpper == "TOTAL LIQUIDO" ||
					regexp.MustCompile(`^(RD|RM|DS|LEY|DL|R\.D\.)`).MatchString(bUpper) ||
					regexp.MustCompile(`^[ui]u-`).MatchString(bUpper) ||
					cargoPatternRe.MatchString(bUpper) ||
					strings.Contains(bUpper, "DNI")
				if !ignore {
					institucion = b
				}
			}
		}
	}
	return institucion, distrito
}

// detectRowInfo scans up to 3 rows before HABERES to find per-employee
// institution and district overrides. Falls back to the global defaults.
func detectRowInfo(rows [][]string, empInfoCol, rIdx int, globalInst, globalDist string) (string, string) {
	inst := globalInst
	dist := globalDist

	for j := 1; j <= 3; j++ {
		prevIdx := rIdx - j
		if prevIdx < 0 {
			break
		}
		pa := strings.ToUpper(strings.TrimSpace(rawCell(rows, prevIdx, 0)))
		pb := strings.TrimSpace(rawCell(rows, prevIdx, empInfoCol-1))

		if pb == "" && pa == "" {
			continue
		}

		// ── Institution ─────────────────────────────────────────────
		if regexp.MustCompile(`(?i)(?:INSTITUCION|I\.?\s*E\.?\s*|COLEGIO|ESCUELA)`).MatchString(pa) {
			if pb != "" {
				inst = pb
				// Don't break — keep looking for district too
			}
		} else if pb != "" {
			pu := strings.ToUpper(pb)
			if pu != "HABERES" && pu != "DSCTOS" &&
				!strings.Contains(pu, "TOTAL") &&
				!strings.Contains(pu, "R.D.") && !regexp.MustCompile(`^(RD|RM|DS|LEY|DL)`).MatchString(pu) &&
				!regexp.MustCompile(`^[iu]u-`).MatchString(pu) &&
				!caneteDistricts[normalizeDistrito(pb)] &&
				!cargoPatternRe.MatchString(pu) &&
				!strings.Contains(pu, "DNI") {
				inst = pb
			}
		}

		// ── District ────────────────────────────────────────────────
		if pb != "" {
			if caneteDistricts[normalizeDistrito(pb)] {
				dist = pb
				break
			}
		}
		if strings.Contains(pa, "DISTRITO") {
			re := regexp.MustCompile(`(?i)DISTRITO\s*:?\s*(.+)`)
			if m := re.FindStringSubmatch(pa); len(m) > 1 && strings.TrimSpace(m[1]) != "" {
				d := strings.TrimSpace(m[1])
				if caneteDistricts[normalizeDistrito(d)] {
					dist = d
					break
				}
			}
		}
	}
	return inst, dist
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

	// Scan header for global institution / district
	globalInst, globalDist := scanHeader(rows, empInfoCol)

	type block struct {
		personal          models.Personal
		planilla          models.PlanillaImport
		expectingDistrito bool
		nameParts         int
	}

	flush := func(cur *block) {
		if cur == nil {
			return
		}
		if cur.personal.Nombres == "" && cur.personal.DNI == "" {
			return
		}
		// Fallback to global district if not detected per-employee
		if cur.planilla.Distrito == "" {
			cur.planilla.Distrito = globalDist
		}
		data.Personal = append(data.Personal, cur.personal)
		data.Planillas = append(data.Planillas, cur.planilla)
	}

	var cur *block
	inSection := "" // "haberes" | "dsctos"

		for rIdx, row := range rows {
			rowNum := rIdx + 1

			// Use the raw value to detect the start of a new merged section
			rawSec := strings.ToUpper(rawCell(rows, rIdx, seccionCol-1))
			rawEmp := rawCell(rows, rIdx, empInfoCol-1)
			rawDet := rawCell(rows, rIdx, detailCol-1)
			rawMon := rawCell(rows, rIdx, amountCol-1)

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
				inst, dist := detectRowInfo(rows, empInfoCol, rIdx, globalInst, globalDist)
				cur = &block{
					personal: models.Personal{
						Nombres: empName,
						Activo:  true,
					},
					planilla: models.PlanillaImport{
						Nombres:     empName,
						Mes:         mes,
						Anio:        anio,
						Institucion: inst,
						Distrito:    dist,
						Ingresos:    []models.IngresoImport{},
						Descuentos:  []models.DescuentoImport{},
					},
					expectingDistrito: true,
				}
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

			// ── Employee-info column (RD, UU, DNI, distrito, puesto) ─────
			if inSection == "haberes" && rawEmp != "" && rawEmp != cur.personal.Nombres {
				cat, val := classifyInfo(rawEmp)
				switch cat {
				case "rd":
					if cur.personal.RD == "" {
						cur.personal.RD = val
					}
					cur.expectingDistrito = false
				case "uu":
					if cur.personal.UU == "" {
						cur.personal.UU = val
					}
					cur.expectingDistrito = false
				case "dni":
					if cur.personal.DNI == "" {
						cur.personal.DNI = val
						cur.planilla.DNI = val
					}
					cur.expectingDistrito = false
			case "cargo":
				if cur.personal.Puesto == "" {
					cur.personal.Puesto = val
				}
			case "puesto":
				if cur.expectingDistrito {
					norm := normalizeDistrito(val)
					if caneteDistricts[norm] || cur.nameParts >= 1 {
						if cur.planilla.Distrito == "" {
							cur.planilla.Distrito = val
						}
						cur.expectingDistrito = false
					} else {
						cur.personal.Nombres = cur.personal.Nombres + " " + val
						cur.planilla.Nombres = cur.planilla.Nombres + " " + val
						cur.nameParts++
					}
				} else if cur.personal.Puesto == "" {
					cur.personal.Puesto = val
				}
				}
				// Fallback: detect district regardless of expecting state
				if cur.planilla.Distrito == "" || cur.planilla.Distrito == globalDist {
					norm := normalizeDistrito(rawEmp)
					if caneteDistricts[norm] {
						cur.planilla.Distrito = rawEmp
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

	// Post-processing: extraer cargo desde el final del nombre
	cargoNombreRe := regexp.MustCompile(
		`(?i)\s+(?:PROF\.?\s*(?:DE\s+AULA|POR\s+HORA)\s*|` +
			`AUX\.?\s*(?:DE\s+EDUC\.?\w*|EDUCACION|EDUCAC\.?)\s*|` +
			`TRAB\.?\s*SERV\.?\w*\s*|` +
			`D\d+|` +
			`AUXILIAR|DOCENTE|DIRECTOR|JEFE|COORDINADOR|` +
			`ESPECIALISTA|TECNICO|ADMINISTRATIVO|PRACTICANTE|APOYO)\s*$`,
	)
	for i := range data.Personal {
		p := &data.Personal[i]
		loc := cargoNombreRe.FindStringIndex(p.Nombres)
		if loc != nil {
			cargoFromNombre := strings.TrimSpace(p.Nombres[loc[0]:loc[1]])
			nombreLimpio := strings.TrimSpace(p.Nombres[:loc[0]])
			if p.Puesto == "" || (!strings.Contains(p.Puesto, ".") && !cargoPatternRe.MatchString(strings.ToUpper(p.Puesto))) {
				p.Puesto = cargoFromNombre
				p.Nombres = nombreLimpio
			}
		}
		// Extract district from end of nombre
		{
			pl := &data.Planilla[i]
			palabras := strings.Fields(p.Nombres)
			var extraidos []string
			for {
				encontrado := false
				for fin := len(palabras); fin > 0; fin-- {
					candidato := strings.Join(palabras[fin-1:], " ")
					if caneteDistricts[normalizeDistrito(candidato)] {
						extraidos = append([]string{candidato}, extraidos...)
						palabras = palabras[:fin-1]
						encontrado = true
						break
					}
				}
				if !encontrado {
					break
				}
			}
			if len(extraidos) > 0 {
				pl.Distrito = strings.Join(extraidos, " ")
				p.Nombres = strings.Join(palabras, " ")
				pl.Nombres = p.Nombres
			}
		}
	}

	log.Printf("[excel] parsed %d personal, %d planillas from %s",
		len(data.Personal), len(data.Planillas), filename)
	return data, nil
}
