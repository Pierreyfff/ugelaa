package handlers

import (
	"fmt"
	"log"
	"math"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/extrame/xls"
	"github.com/xuri/excelize/v2"
)

type extractedEmployee struct {
	Nombre          string          `json:"nombre"`
	Institucion     string          `json:"institucion"`
	Distrito        string          `json:"distrito"`
	Cargo           string          `json:"cargo"`
	Resolucion      string          `json:"resolucion"`
	Codigo          string          `json:"codigo"`
	DNI             string          `json:"dni"`
	Haberes         []conceptoItem  `json:"haberes"`
	Descuentos      []conceptoItem  `json:"descuentos"`
	TotalHaberes    *float64        `json:"total_haberes"`
	TotalDescuentos *float64        `json:"total_descuentos"`
	TotalLiquido    *float64        `json:"total_liquido"`
}

type conceptoItem struct {
	Concepto string  `json:"concepto"`
	Monto    float64 `json:"monto"`
}

type duplicateAnalysis struct {
	DNIsDuplicados    []dniDupInfo     `json:"dnis_duplicados"`
	NombresDuplicados []nombreDupInfo  `json:"nombres_duplicados"`
	Exactos           int              `json:"exactos"`
	ExactosIndices    []int            `json:"exactos_indices"`
}

type dniDupInfo struct {
	DNI       string        `json:"dni"`
	Count     int           `json:"count"`
	Empleados []dupEmpleado `json:"empleados"`
}

type nombreDupInfo struct {
	Nombre    string        `json:"nombre"`
	Count     int           `json:"count"`
	Empleados []dupEmpleado `json:"empleados"`
}

type dupEmpleado struct {
	Idx    int     `json:"idx"`
	Nombre string  `json:"nombre"`
	DNI    string  `json:"dni"`
	Monto  *float64 `json:"monto"`
}

var (
	dniPattern      = regexp.MustCompile(`(?i)DNI\s*(\d+)`)
	instKeyword     = regexp.MustCompile(`(?i)INSTITUCION|INSTITUCIÓN`)
	distKeyword     = regexp.MustCompile(`(?i)DISTRITO`)
	instPrefix      = regexp.MustCompile(`^(?i)(CE\b|CB\b|C\.E\.|E\.E\.|I\.E\.|IE\b|CEBA|CEBE|EE\s|EE\b|JARDIN|COLEGIO|ESCUELA|INSTITUCION|INSTITUTO|C\.E)`)
	instNumero      = regexp.MustCompile(`^\d{3,4}\s`)
	instCE          = regexp.MustCompile(`(?i)^CEI?\s+\d{3,5}`)
	rdPattern       = regexp.MustCompile(`(?i)^(RD|RM|DS|LEY|DL|R\.D\.|R\.M\.|R\.N\.|R\.G\.|DRD\.|CN\.|C\.N\.|RDL|RDUSE\.|INF\.|DF\.|EXP\.)\w*\s*[\d\-./A-Za-z\s]+`)
	uuPattern       = regexp.MustCompile(`(?i)^uu-`)
	cargoPatron     = regexp.MustCompile(`(?i)^(?:\s*` +
		`PROF\.\s*(?:DE\s+AULA|POR\s+HORA|AULA)?\b` +
		`|PROF(?:-|\s)AULA\b` +
		`|DOC\.\s*(?:COORD(?:INAD)?\.?|BIBLIOTEC)\b|DOCENTE\b` +
		`|DIRECTOR\b|DIREC\.?(?:\s*C\.?\s*E|TOR|INTERINA|INT|C\.?\s*E\.?)?\b|SUBDIRECTOR\b` +
		`|AUX\.\s*(?:DE\s+EDUC(?:ACI[OÓ]N?)?\.?|BIBLIOT(?:ECA|EC)?\.?|EDUC(?:AC?\.?|ACI[OÓ]N?)?|LABORAT(?:ORIO)?\.?)?\b` +
		`|EUX\.EDUC\.?\b` +
		`|TRAB\.?\s*(?:DE[.\s]+SERV(?:IC)?\.?|SERV\.?)\s*I{0,3}\b` +
		`|TRAB(?:-|\s)SERV\.?\s*I{0,3}\b|TRABSERV\.?I?\b` +
		`|PER\.\s*SERV?\.?I{0,2}\b|SERVICIO\b` +
		`|ASESOR\b|SECRETARIA\b|SECRETARIO\b` +
		`|OFICINISTA\b|OFIC(?:\.|INA)?\b|OFI\.II\b|OF\b` +
		`|ESPECIALISTA\b|COORDINADOR\b|COORD\b|JEFE\b|PROMOTOR\b` +
		`|TECNICO\b|PSICOLOGO\b|ENFERMERO\b|MEDICO\b|ADMINISTRATIVO\b` +
		`|INSPECTOR\b|BIBLIOTECARIO\b|LABORATORIO\b|LABORAT\.\b` +
		`|EDUCAC\.\b|EDUCACIÓN\b|EDUCACION\b` +
		`|ASIST(?:\.|\s+)(?:SOCIAL|HIST\.GEO|MATEMATICAS)\b` +
		`|ASE\.CC\.NN\b` +
		`|PERSONAL\b` +
		`|SU-DIR(?:-|\s+)(?:AREA|ED-PRI-N)\b` +
		`|D3120\b` +
		`)\s*`)

	ignorarConceptos = map[string]bool{
		"REINTEGRO": true, "ESCOLARIDAD": true, "AGUINALDO": true, "DETALLE": true,
	}

	noInstDist = []string{
		"HABERES", "DSCTOS", "TOTAL", "DNI", "RD ", "R.D.", "RM ", "R.M.",
		"UU-", "PROF.", "DIRECTOR", "AUX.", "ASESOR", "SECRETARIA",
		"SECRETARIO", "OFICINISTA", "ESPECIALISTA",
		"COORDINADOR", "JEFE", "SUBDIRECTOR", "PROMOTOR", "TECNICO",
		"PSICOLOGO", "ENFERMERO", "MEDICO", "TRABAJADOR", "ADMINISTRATIVO",
		"BASICA", "DETALLE", "REINTEGRO", "ESCOLARIDAD", "AGUINALDO",
		"DL20", "DL25", "LEY ", "LEY-", "CN.", "C.N.", "EXP.", "INF.",
		"DRD.", "DF.",
	}

	distritosConocidos = []string{
		"ASIA", "CALANGO", "CERRO AZUL", "CHILCA", "COAYLLO", "IMPERIAL",
		"LUNAHUANÁ", "LUNAHUANA", "MALA", "NUEVO IMPERIAL", "PACARÁN",
		"QUILMANÁ", "QUILMANA", "SAN ANTONIO", "SAN LUIS",
		"SAN VICENTE DE CAÑETE", "SANTA CRUZ DE FLORES", "ZÚÑIGA", "ZUÑIGA",
	}

	distritosSet     map[string]bool
	distritosNormMap map[string]string
)

func init() {
	distritosSet = make(map[string]bool)
	distritosNormMap = make(map[string]string)
	for _, d := range distritosConocidos {
		distritosSet[strings.ToUpper(d)] = true
		norm := normalize(d)
		distritosNormMap[norm] = d
	}
	distritosNormMap["SAN VICENTE CAÑETE"] = "SAN VICENTE DE CAÑETE"
	distritosNormMap[normalize("SAN VICENTE CAÑETE")] = "SAN VICENTE DE CAÑETE"
}

func normalize(texto string) string {
	t := strings.ToUpper(strings.TrimSpace(texto))
	t = strings.NewReplacer(
		"Ñ", "N", "Á", "A", "É", "E", "Í", "I", "Ó", "O", "Ú", "U",
	).Replace(t)
	re := regexp.MustCompile(`[^\w\s\.\-]`)
	t = re.ReplaceAllString(t, " ")
	re2 := regexp.MustCompile(`\s+`)
	t = re2.ReplaceAllString(t, " ")
	return strings.TrimSpace(t)
}

func parseCellFloat(s string) float64 {
	s = strings.TrimSpace(strings.ReplaceAll(s, ",", "."))
	if s == "" {
		return 0
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return math.Round(v*100) / 100
}

func parseCellFloatPtr(s string) *float64 {
	s = strings.TrimSpace(strings.ReplaceAll(s, ",", "."))
	if s == "" || s == "0" || s == "0.00" {
		return nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil || v == 0 {
		return nil
	}
	r := math.Round(v*100) / 100
	return &r
}

func cleanConcept(c string) string {
	return strings.TrimSpace(strings.TrimLeft(c, "+"))
}

func extractDNI(texto string) string {
	if texto == "" {
		return ""
	}
	m := dniPattern.FindStringSubmatch(texto)
	if len(m) > 1 {
		return m[1]
	}
	return ""
}

func isNotInstDist(texto string) bool {
	t := strings.ToUpper(strings.TrimSpace(texto))
	for _, p := range noInstDist {
		if strings.HasPrefix(t, p) {
			return true
		}
	}
	return false
}

func extractInstitution(texto string) string {
	t := strings.TrimRight(strings.TrimSpace(texto), ":-–—")
	if isNotInstDist(t) {
		return ""
	}
	if m := instKeyword.FindString(t); m != "" {
		parts := instKeyword.Split(t, 2)
		if len(parts) > 1 && strings.TrimSpace(parts[1]) != "" {
			return strings.TrimRight(strings.TrimSpace(parts[1]), ":-–—")
		}
	}
	if instPrefix.MatchString(t) {
		return t
	}
	if instNumero.MatchString(t) {
		return t
	}
	if instCE.MatchString(t) {
		return t
	}
	return ""
}

func extractDistrict(texto string) string {
	t := strings.TrimRight(strings.TrimSpace(texto), ":-–—")
	u := strings.ToUpper(t)
	if isNotInstDist(t) {
		return ""
	}
	if m := distKeyword.FindString(t); m != "" {
		parts := distKeyword.Split(t, 2)
		if len(parts) > 1 && strings.TrimSpace(parts[1]) != "" {
			return strings.TrimRight(strings.TrimSpace(parts[1]), ":-–—")
		}
	}
	if distritosSet[u] {
		return u
	}
	for _, dist := range distritosConocidos {
		if strings.Contains(u, strings.ToUpper(dist)) {
			return dist
		}
	}
	for _, dist := range distritosConocidos {
		du := strings.ToUpper(dist)
		if strings.HasPrefix(du, u) && len(u) >= 3 {
			return dist
		}
	}
	for _, dist := range distritosConocidos {
		du := strings.ToUpper(dist)
		primeros := du
		if parts := strings.SplitN(du, " ", 2); len(parts) > 1 {
			primeros = parts[0]
		}
		if len(primeros) >= 4 && strings.HasPrefix(u, primeros) {
			return dist
		}
	}
	tNorm := normalize(texto)
	if d, ok := distritosNormMap[tNorm]; ok {
		return d
	}
	for dNorm, dOrig := range distritosNormMap {
		if strings.Contains(tNorm, dNorm) {
			return dOrig
		}
		if len(tNorm) >= 4 && strings.HasPrefix(dNorm, tNorm) {
			return dOrig
		}
		tFirst := tNorm
		if parts := strings.SplitN(tNorm, " ", 2); len(parts) > 1 {
			tFirst = parts[0]
		}
		dFirst := dNorm
		if parts := strings.SplitN(dNorm, " ", 2); len(parts) > 1 {
			dFirst = parts[0]
		}
		if len(tFirst) >= 4 && strings.HasPrefix(tNorm, dFirst) {
			return dOrig
		}
	}
	return ""
}

func classifyEmployeeInfo(texto string, emp *extractedEmployee) {
	if texto == "" {
		return
	}
	t := strings.TrimSpace(texto)

	if dni := extractDNI(texto); dni != "" && emp.DNI == "" {
		emp.DNI = dni
		return
	}
	if emp.Resolucion == "" && rdPattern.MatchString(texto) {
		emp.Resolucion = t
		return
	}
	if emp.Codigo == "" && uuPattern.MatchString(texto) {
		emp.Codigo = t
		return
	}
	if emp.Distrito == "" {
		if dist := extractDistrict(texto); dist != "" {
			emp.Distrito = dist
			return
		}
	}
	if emp.Institucion == "" {
		if inst := extractInstitution(texto); inst != "" {
			emp.Institucion = inst
			return
		}
	}
	if emp.Cargo == "" && cargoPatron.MatchString(t) {
		if extractDistrict(t) == "" && extractInstitution(t) == "" {
			emp.Cargo = t
			return
		}
	}
	if isNotInstDist(t) {
		return
	}
	if emp.Cargo == "" {
		if extractDistrict(texto) == "" && extractInstitution(texto) == "" {
			emp.Cargo = t
		}
	}
}

// readExcelRows reads all rows from an .xlsx or .xls file, returning
// [][]string with a consistent column count (padded with "").
//
// Strategy:
//   - Always tries excelize first (handles .xlsx natively, plus some .xls)
//   - If excelize fails AND the file is .xls, falls back to extrame/xls
//   - Does NOT propagate merged cell values (matches openpyxl's values_only=True)
//   - Trailing empty columns are padded so every row has ≥4 columns
func readExcelRows(filepath string) ([][]string, error) {
	ext := strings.ToLower(filepath[strings.LastIndex(filepath, "."):])

	switch ext {
	case ".xls":
		// Try excelize first — it handles some .xls formats
		rows, err := readXLSX(filepath)
		if err == nil {
			return rows, nil
		}
		// Fall through to extrame/xls
		log.Printf("[xls] excelize failed for .xls: %v, trying extrame/xls", err)
		return readXLS(filepath)
	case ".xlsx", ".xlsm":
		return readXLSX(filepath)
	default:
		return nil, fmt.Errorf("formato de archivo no compatible: %s. Use .xlsx o .xls", ext)
	}
}

func readXLSX(filepath string) ([][]string, error) {
	f, err := excelize.OpenFile(filepath)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "unsupported") || strings.Contains(errMsg, "format") {
			return nil, fmt.Errorf("el formato del archivo .xlsx no es compatible. Abra el archivo en Excel y guárdelo como .xlsx (Excel 2007+)")
		}
		return nil, fmt.Errorf("error al abrir archivo Excel: %w", err)
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, fmt.Errorf("error al leer hojas del Excel: %w", err)
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("el archivo Excel está vacío")
	}

	maxCols := 4
	for _, row := range rows {
		if len(row) > maxCols {
			maxCols = len(row)
		}
	}

	result := make([][]string, len(rows))
	for rIdx, row := range rows {
		padded := make([]string, maxCols)
		for cIdx := 0; cIdx < maxCols; cIdx++ {
			if cIdx < len(row) {
				padded[cIdx] = strings.TrimSpace(row[cIdx])
			}
		}
		result[rIdx] = padded
	}
	return result, nil
}

func readXLS(filepath string) (rows [][]string, err error) {
	// Recover from panics inside extrame/xls (unstable with some files)
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("el archivo .xls no pudo ser leído. "+
				"Ábralo en Excel y guárdelo como .xlsx (Excel 2007+). "+
				"Error interno: %v", r)
		}
	}()

	wb, err := xls.Open(filepath, "utf-8")
	if err != nil {
		return nil, fmt.Errorf("error al abrir archivo .xls: %w", err)
	}

	sheet := wb.GetSheet(0)
	if sheet == nil {
		return nil, fmt.Errorf("el archivo .xls no contiene hojas")
	}

	totalRows := int(sheet.MaxRow) + 1
	if totalRows <= 0 {
		return nil, fmt.Errorf("el archivo .xls está vacío")
	}

	rawRows := make([][]string, 0, totalRows)
	maxCols := 4

	for r := 0; r < totalRows; r++ {
		row := sheet.Row(r)
		if row == nil {
			rawRows = append(rawRows, nil)
			continue
		}
		lastCol := row.LastCol()
		if lastCol != 0 {
			firstCol := row.FirstCol()
			if firstCol > 0 || lastCol > firstCol {
				maxCols = max(maxCols, lastCol)
			}
		}
		cellRow := make([]string, 0, lastCol)
		for c := 0; c < lastCol; c++ {
			cellRow = append(cellRow, strings.TrimSpace(row.Col(c)))
		}
		rawRows = append(rawRows, cellRow)
	}

	if len(rawRows) == 0 {
		return nil, fmt.Errorf("el archivo .xls está vacío")
	}
	if maxCols < 4 {
		maxCols = 4
	}

	result := make([][]string, len(rawRows))
	for rIdx, row := range rawRows {
		padded := make([]string, maxCols)
		for cIdx := 0; cIdx < maxCols; cIdx++ {
			if row != nil && cIdx < len(row) {
				padded[cIdx] = row[cIdx]
			}
		}
		result[rIdx] = padded
	}
	return result, nil
}

func scanHeader(rows [][]string) (institucion, distrito string) {
	limit := len(rows)
	if limit > 30 {
		limit = 30
	}
	for i := 0; i < limit; i++ {
		row := rows[i]
		var cols []string
		if len(row) > 0 && row[0] != "" {
			cols = append(cols, row[0])
		}
		if len(row) > 1 && row[1] != "" {
			cols = append(cols, row[1])
		}
		if len(row) > 2 && row[2] != "" {
			cols = append(cols, row[2])
		}
		for _, celda := range cols {
			if distrito == "" {
				if d := extractDistrict(celda); d != "" {
					distrito = d
				}
			}
			if institucion == "" {
				if inst := extractInstitution(celda); inst != "" && celda != distrito {
					if extractDistrict(celda) == "" {
						institucion = inst
					}
				}
			}
		}
		if institucion != "" && distrito != "" {
			break
		}
	}
	// Fallback: if only institution found, try col B of remaining rows
	if institucion != "" && distrito == "" {
		for i := 0; i < limit; i++ {
			if len(rows[i]) > 1 && rows[i][1] != "" && rows[i][1] != institucion {
				if d := extractDistrict(rows[i][1]); d != "" {
					distrito = d
					break
				}
			}
		}
	}
	return
}

func extractEmployees(filepath string) ([]extractedEmployee, error) {
	rows, err := readExcelRows(filepath)
	if err != nil {
		return nil, err
	}

	encInst, encDist := scanHeader(rows)

	var empleados []extractedEmployee
	i := 0
	n := len(rows)

	for i < n {
		row := rows[i]
		colA := ""
		if len(row) > 0 {
			colA = row[0]
		}

		if colA == "HABERES" && len(row) > 1 && row[1] != "" {
			nombreCompleto := row[1]

			// Look up for institution/district in preceding rows (up to 12 rows back)
			instActual := encInst
			distActual := encDist
			j := i - 1
			for j >= 0 && j > i-12 {
				prev := rows[j]
				prevA := ""
				prevB := ""
				if len(prev) > 0 {
					prevA = prev[0]
				}
				if len(prev) > 1 {
					prevB = prev[1]
				}
				for _, celda := range []string{prevB, prevA} {
					if celda == "" || celda == nombreCompleto {
						continue
					}
					if inst := extractInstitution(celda); inst != "" && inst != nombreCompleto {
						instActual = inst
					}
					if dist := extractDistrict(celda); dist != "" && dist != nombreCompleto {
						distActual = dist
					}
				}
				if instActual != "" && distActual != "" {
					break
				}
				j--
			}

			emp := extractedEmployee{
				Nombre:      nombreCompleto,
				Institucion: instActual,
				Distrito:    distActual,
			}

			// Initial concept in columns C-D
			if len(row) > 2 && row[2] != "" {
				concepto := row[2]
				if !ignorarConceptos[strings.ToUpper(cleanConcept(concepto))] {
					valor := float64(0)
					if len(row) > 3 && row[3] != "" {
						valor = parseCellFloat(row[3])
					}
					if valor != 0 {
						emp.Haberes = append(emp.Haberes, conceptoItem{Concepto: concepto, Monto: valor})
					}
				}
			}

			seccion := "HABERES"
			i++
			if i >= n {
				empleados = append(empleados, emp)
				break
			}

			for i < n {
				f := rows[i]
				a := ""
				b := ""
				c := ""
				d := float64(0)

				if len(f) > 0 {
					a = f[0]
				}
				if len(f) > 1 {
					b = f[1]
				}
				if len(f) > 2 {
					c = f[2]
				}
				if len(f) > 3 {
					d = parseCellFloat(f[3])
				}

				if a == "TOTAL HABERES" {
					if d != 0 {
						emp.TotalHaberes = &d
					}
					i++
					continue
				}
				if a == "TOTAL DESCUENTOS" {
					if d != 0 {
						emp.TotalDescuentos = &d
					}
					i++
					continue
				}
				if a == "TOTAL LIQUIDO" {
					if d != 0 {
						emp.TotalLiquido = &d
					}
					i++
					break
				}
				if a == "DSCTOS" {
					seccion = "DSCTOS"
					if c != "" && !ignorarConceptos[strings.ToUpper(cleanConcept(c))] && d != 0 {
						emp.Descuentos = append(emp.Descuentos, conceptoItem{Concepto: c, Monto: d})
					}
					i++
					continue
				}
				if a == "HABERES" && len(f) > 1 && f[1] != "" {
					break
				}
				if b != "" {
					classifyEmployeeInfo(b, &emp)
				}
				if c != "" {
					nombreLimpio := strings.ToUpper(cleanConcept(c))
					if !ignorarConceptos[nombreLimpio] && !strings.HasPrefix(nombreLimpio, "+") && d != 0 {
						item := conceptoItem{Concepto: strings.TrimSpace(c), Monto: d}
						if seccion == "HABERES" {
							emp.Haberes = append(emp.Haberes, item)
						} else {
							emp.Descuentos = append(emp.Descuentos, item)
						}
					}
				}
				i++
			}

			empleados = append(empleados, emp)
			continue
		}
		i++
	}

	return empleados, nil
}

func analyzeDuplicates(empleados []extractedEmployee) duplicateAnalysis {
	type empInfo struct {
		idx    int
		nombre string
		dni    string
		monto  *float64
	}

	dniCount := make(map[string]int)
	dniEmpleados := make(map[string][]empInfo)
	nombreCount := make(map[string]int)
	nombreEmpleados := make(map[string][]empInfo)

	for idx, emp := range empleados {
		dni := emp.DNI
		nombre := emp.Nombre
		monto := emp.TotalLiquido

		if dni != "" {
			dniCount[dni]++
			dniEmpleados[dni] = append(dniEmpleados[dni], empInfo{idx: idx, nombre: nombre, dni: dni, monto: monto})
		}
		if nombre != "" {
			norm := strings.ToLower(strings.TrimSpace(nombre))
			norm = strings.Join(strings.Fields(norm), " ")
			nombreCount[norm]++
			nombreEmpleados[norm] = append(nombreEmpleados[norm], empInfo{idx: idx, nombre: nombre, dni: dni, monto: monto})
		}
	}

	var dnisDup []dniDupInfo
	for dni, count := range dniCount {
		if count > 1 {
			var emps []dupEmpleado
			for _, e := range dniEmpleados[dni] {
				emps = append(emps, dupEmpleado{Idx: e.idx, Nombre: e.nombre, DNI: dni, Monto: e.monto})
			}
			dnisDup = append(dnisDup, dniDupInfo{DNI: dni, Count: count, Empleados: emps})
		}
	}

	var nombresDup []nombreDupInfo
	for nombre, count := range nombreCount {
		if count > 1 {
			var emps []dupEmpleado
			for _, e := range nombreEmpleados[nombre] {
				emps = append(emps, dupEmpleado{Idx: e.idx, Nombre: e.nombre, DNI: e.dni, Monto: e.monto})
			}
			nombresDup = append(nombresDup, nombreDupInfo{Nombre: nombre, Count: count, Empleados: emps})
		}
	}

	exactosCount := 0
	var exactosIndices []int
	for _, empList := range dniEmpleados {
		if len(empList) <= 1 {
			continue
		}
		nameGroups := make(map[string][]empInfo)
		for _, emp := range empList {
			normKey := strings.ToLower(strings.TrimSpace(emp.nombre))
			normKey = strings.Join(strings.Fields(normKey), " ")
			nameGroups[normKey] = append(nameGroups[normKey], emp)
		}
		for _, group := range nameGroups {
			for _, emp := range group[1:] {
				exactosCount++
				exactosIndices = append(exactosIndices, emp.idx)
			}
		}
	}

	return duplicateAnalysis{
		DNIsDuplicados:    dnisDup,
		NombresDuplicados: nombresDup,
		Exactos:           exactosCount,
		ExactosIndices:    exactosIndices,
	}
}

func calculateTotalAmount(empleados []extractedEmployee) float64 {
	total := 0.0
	for _, emp := range empleados {
		if emp.TotalLiquido != nil {
			total += *emp.TotalLiquido
		}
	}
	return math.Round(total*100) / 100
}

func saveUploadedFile(data []byte, filename string) error {
	return os.WriteFile(filename, data, 0644)
}
