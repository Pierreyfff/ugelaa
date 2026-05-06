import os
import re
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from openpyxl import load_workbook
from werkzeug.utils import secure_filename

app = Flask(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
UPLOAD_FOLDER = "/app/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

MESES = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
}


def to_float(val):
    """Safely convert to float; handles comma decimal separators."""
    if val is None:
        return 0.0
    try:
        return float(str(val).replace(',', '.'))
    except (ValueError, TypeError):
        return 0.0


def to_str(val):
    """Return stripped string or empty string."""
    if val is None:
        return ''
    return str(val).strip()


def build_merged_map(ws):
    """
    Return a dict mapping (row, col) -> cell_value for every cell that
    belongs to a merged range, using the top-left cell's value.
    """
    merged = {}
    for rng in ws.merged_cells.ranges:
        top_val = ws.cell(rng.min_row, rng.min_col).value
        for r in range(rng.min_row, rng.max_row + 1):
            for c in range(rng.min_col, rng.max_col + 1):
                merged[(r, c)] = top_val
    return merged


def find_columns(ws):
    """
    Scan the first 15 rows to detect:
      mes        – month number (1-12)
      anio       – year (4-digit number, or current year)
      detalle_col – 1-based column index of the 'DETALLE' header
      monto_col  – 1-based column index of the month-name header
    """
    mes = 0
    anio = datetime.now().year
    detalle_col = None
    monto_col = None

    for r in range(1, min(16, ws.max_row + 1)):
        for c in range(1, ws.max_column + 1):
            raw = ws.cell(r, c).value
            if raw is None:
                continue
            s = str(raw).strip().lower()
            if s == 'detalle':
                detalle_col = c
            elif s in MESES:
                mes = MESES[s]
                monto_col = c
            else:
                # Partial match on first 3 chars
                for mname, mnum in MESES.items():
                    if len(s) >= 3 and s.startswith(mname[:3]):
                        mes = mnum
                        monto_col = c
                        break
                # Year detection
                yr = re.search(r'20\d{2}', str(raw))
                if yr:
                    anio = int(yr.group())

    if detalle_col is None:
        detalle_col = 3  # fallback: column C
    if monto_col is None:
        monto_col = detalle_col + 1  # fallback: column right after DETALLE

    return mes, anio, detalle_col, monto_col


def classify_emp_info(text):
    """
    Classify employee info cell text.
    Returns a tuple (category, value) where category is one of:
      'rd' | 'uu' | 'dni' | 'puesto'
    """
    if not text:
        return None, None
    u = text.upper().strip()
    if re.match(r'^RD[\s\-/]', u) or re.match(r'^R\.?D\.?[\s\-/]', u):
        return 'rd', text
    if re.match(r'^UU[\s\-\d]', u) or u.startswith('UU-'):
        return 'uu', text
    if 'DNI' in u:
        digits = re.sub(r'\D', '', text)
        return 'dni', digits
    return 'puesto', text


def parse_excel_planilla(filepath):
    """
    Parse a payroll Excel file that uses a vertical-block layout.

    Each employee occupies one block structured as:

      Col seccion | Col empinfo        | Col detalle | Col monto
      ─────────────────────────────────────────────────────────
      HABERES     | Apellidos Nombres  | BASICA      | 0.03
      (merged)    | (merged)           | PERSONAL    | 0.01
                  | PUESTO             | DL19990     | 60.00
                  | RD xxx-xx          | TPH         | 19.20
                  | uu-xx-x-xxx        | Diferencial | 5.05
      DSCTOS      |                    | DL20530     | 3.80
      TOTAL HABERES                                  | 153.92
      TOTAL DESCUENTOS                               | 76.27
      TOTAL LIQUIDO                                  | 77.65

    Multiple employee blocks appear stacked vertically.
    """
    wb = load_workbook(filepath, data_only=True)
    results = {"personal": [], "planillas": []}

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        if not ws.max_row or ws.max_row < 2:
            continue

        merged_map = build_merged_map(ws)
        mes, anio, detalle_col, monto_col = find_columns(ws)

        # Refine year from sheet name
        yr_in_sheet = re.search(r'20\d{2}', str(sheet_name))
        if yr_in_sheet:
            anio = int(yr_in_sheet.group())

        # Derive adjacent columns
        empinfo_col = max(1, detalle_col - 1)
        seccion_col = max(1, detalle_col - 2)
        if seccion_col == empinfo_col:
            seccion_col = 1
            empinfo_col = 2

        def raw_val(r, c):
            return ws.cell(r, c).value

        def merged_val(r, c):
            return merged_map.get((r, c), ws.cell(r, c).value)

        def full_row_text(r):
            parts = [to_str(merged_val(r, c)) for c in range(1, min(ws.max_column + 1, 20))]
            return ' '.join(parts).upper()

        current = None     # dict with keys 'personal' and 'planilla'
        in_section = None  # 'haberes' | 'dsctos'

        for r in range(1, ws.max_row + 1):
            # Use raw (non-merged) values to detect first-row-of-merge markers
            raw_sec = to_str(raw_val(r, seccion_col)).upper()
            raw_emp = to_str(raw_val(r, empinfo_col))
            raw_det = to_str(raw_val(r, detalle_col))
            raw_mon = raw_val(r, monto_col)

            row_text = full_row_text(r)

            # ── End-of-block markers ──────────────────────────────────────
            if 'TOTAL HABERES' in row_text:
                if current:
                    results["personal"].append(current["personal"])
                    results["planillas"].append(current["planilla"])
                current = None
                in_section = None
                continue
            if 'TOTAL DESCUENTO' in row_text or 'TOTAL LIQUIDO' in row_text:
                continue

            # ── New HABERES block ─────────────────────────────────────────
            if raw_sec == 'HABERES':
                if current:  # close any unclosed previous block
                    results["personal"].append(current["personal"])
                    results["planillas"].append(current["planilla"])
                in_section = 'haberes'
                current = {
                    'personal': {
                        'nombres': raw_emp,
                        'apellidos': '',
                        'puesto': '',
                        'rd': '',
                        'uu': '',
                        'dni': '',
                        'activo': True,
                    },
                    'planilla': {
                        'mes': mes,
                        'anio': anio,
                        'nombres': raw_emp,  # for linking when DNI is absent
                        'dni': '',
                        'ingresos': [],
                        'descuentos': [],
                    },
                }
                # First ingreso item may be on the same row as HABERES
                if raw_det:
                    m = to_float(raw_mon)
                    if m > 0:
                        current['planilla']['ingresos'].append(
                            {'tipo': raw_det, 'monto': round(m, 2)}
                        )
                continue

            # ── DSCTOS block ──────────────────────────────────────────────
            if ('DSCTO' in raw_sec or 'DESCUENTO' in raw_sec) and current is not None:
                in_section = 'dsctos'
                if raw_det:
                    m = to_float(raw_mon)
                    if m > 0:
                        current['planilla']['descuentos'].append(
                            {'tipo': raw_det, 'monto': round(m, 2)}
                        )
                continue

            if current is None:
                continue

            # ── Employee info in empinfo column ───────────────────────────
            if raw_emp and in_section == 'haberes' and raw_emp != current['personal']['nombres']:
                cat, val = classify_emp_info(raw_emp)
                pers = current['personal']
                if cat == 'rd' and not pers['rd']:
                    pers['rd'] = val
                elif cat == 'uu' and not pers['uu']:
                    pers['uu'] = val
                elif cat == 'dni' and not pers['dni']:
                    pers['dni'] = val
                    current['planilla']['dni'] = val
                elif cat == 'puesto' and not pers['puesto']:
                    pers['puesto'] = val

            # ── Line item (ingreso or descuento) ──────────────────────────
            if raw_det and in_section:
                m = to_float(raw_mon)
                if m > 0:
                    item = {'tipo': raw_det, 'monto': round(m, 2)}
                    if in_section == 'haberes':
                        current['planilla']['ingresos'].append(item)
                    else:
                        current['planilla']['descuentos'].append(item)

    return results


# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/process-excel", methods=["POST"])
def process_excel():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró archivo"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Archivo sin nombre"}), 400

    filename = secure_filename(file.filename)
    if not filename.lower().endswith(('.xlsx', '.xls')):
        return jsonify({"error": "Solo se aceptan archivos Excel (.xlsx, .xls)"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        data = parse_excel_planilla(filepath)

        # Send parsed JSON to Go backend (avoids re-parsing on the Go side)
        response = requests.post(
            f"{BACKEND_URL}/api/importar/json",
            json=data,
            timeout=60,
        )

        if response.status_code == 200:
            return jsonify({
                "message": "Excel procesado correctamente",
                "personal_count": len(data["personal"]),
                "planillas_count": len(data["planillas"]),
                "backend_response": response.json(),
            })
        else:
            return jsonify({
                "error": "Error al enviar al backend",
                "details": response.text,
            }), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route("/validate-excel", methods=["POST"])
def validate_excel():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró archivo"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Archivo sin nombre"}), 400

    filename = secure_filename(file.filename)
    if not filename.lower().endswith(('.xlsx', '.xls')):
        return jsonify({"error": "Solo se aceptan archivos Excel (.xlsx, .xls)"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        data = parse_excel_planilla(filepath)
        return jsonify({
            "valid": True,
            "personal_count": len(data["personal"]),
            "planillas_count": len(data["planillas"]),
            "preview": {
                "personal": data["personal"][:5],
                "planillas": data["planillas"][:5],
            },
        })
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 400
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081)