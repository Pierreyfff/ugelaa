import io
import os
import re
import time
import requests
import xlrd
from flask import Flask, request, jsonify, send_file
from openpyxl import load_workbook
from werkzeug.utils import secure_filename

app = Flask(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
UPLOAD_FOLDER = "/app/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

DNI_PATTERN = re.compile(r"DNI\s*(\d+)", re.IGNORECASE)
INST_PATTERN = re.compile(r"INSTITUCION|INSTITUCIÓN", re.IGNORECASE)
DIST_PATTERN = re.compile(r"DISTRITO", re.IGNORECASE)
IGNORAR_CONCEPTOS = {"REINTEGRO", "ESCOLARIDAD", "AGUINALDO", "DETALLE"}


def parsear_valor(v):
    if v is None:
        return None
    try:
        f = float(v)
        return round(f, 2) if f else None
    except (TypeError, ValueError):
        return None


def limpiar_concepto(c: str) -> str:
    return c.strip().lstrip("+").strip().upper()


def analizar_duplicados(empleados: list) -> dict:
    dni_count = {}
    nombre_count = {}
    dni_empleados = {}
    nombre_empleados = {}
    
    for emp in empleados:
        dni = emp.get("dni")
        nombre = emp.get("nombre")
        monto = emp.get("total_liquido")
        
        if dni:
            if dni not in dni_count:
                dni_count[dni] = 0
                dni_empleados[dni] = []
            dni_count[dni] += 1
            dni_empleados[dni].append({"nombre": nombre, "monto": monto})
        
        if nombre:
            if nombre not in nombre_count:
                nombre_count[nombre] = 0
                nombre_empleados[nombre] = []
            nombre_count[nombre] += 1
            nombre_empleados[nombre].append({"dni": dni, "monto": monto})
    
    dnis_duplicados = [(dni, count) for dni, count in dni_count.items() if count > 1]
    nombres_duplicados = [(nombre, count) for nombre, count in nombre_count.items() if count > 1]
    
    return {
        "dnis_duplicados": [{"dni": dni, "count": count, "empleados": dni_empleados[dni]} for dni, count in dnis_duplicados],
        "nombres_duplicados": [{"nombre": nombre, "count": count, "empleados": nombre_empleados[nombre]} for nombre, count in nombres_duplicados],
    }


def calcular_monto_total(empleados: list) -> float:
    total = 0.0
    for emp in empleados:
        liquido = emp.get("total_liquido")
        if liquido:
            total += float(liquido)
    return round(total, 2)


def extraer_dni(texto: str):
    if not texto:
        return None
    m = DNI_PATTERN.search(str(texto))
    return m.group(1) if m else None


def _leer_filas(filepath: str) -> list:
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".xls":
        wb = xlrd.open_workbook(filepath)
        ws = wb.sheet_by_index(0)
        filas = []
        for rx in range(ws.nrows):
            row = []
            for cx in range(ws.ncols):
                cell = ws.cell(rx, cx)
                if cell.ctype in (0, 5, 6):
                    row.append(None)
                elif cell.ctype == 2:
                    v = cell.value
                    row.append(int(v) if v == int(v) else v)
                else:
                    row.append(cell.value)
            filas.append(tuple(row))
        return filas
    else:
        wb = load_workbook(filepath, data_only=True)
        ws = wb.active
        return list(ws.iter_rows(values_only=True))


def escanear_encabezado(filas: list) -> dict:
    info = {"institucion": None, "distrito": None}
    for row in filas[:20]:
        for celda in row:
            texto = str(celda).strip() if celda else ""
            if not texto:
                continue
            if INST_PATTERN.search(texto):
                partes = re.split(r"INSTITUCION|INSTITUCIÓN", texto, flags=re.IGNORECASE)
                if len(partes) > 1 and partes[1].strip():
                    info["institucion"] = partes[1].strip().rstrip(":-–—")
            if DIST_PATTERN.search(texto):
                partes = re.split(r"DISTRITO", texto, flags=re.IGNORECASE)
                if len(partes) > 1 and partes[1].strip():
                    info["distrito"] = partes[1].strip().rstrip(":-–—")
    return info


def extraer_empleados(filepath: str) -> list:
    filas = _leer_filas(filepath)
    encabezado = escanear_encabezado(filas)

    empleados = []
    i = 0
    n = len(filas)

    while i < n:
        fila = filas[i]
        col_a = str(fila[0]).strip() if fila[0] else ""

        if col_a == "HABERES" and len(fila) > 1 and fila[1]:
            nombre_completo = str(fila[1]).strip()

            emp = {
                "nombre": nombre_completo,
                "institucion": encabezado["institucion"],
                "distrito": encabezado["distrito"],
                "cargo": None,
                "resolucion": None,
                "codigo": None,
                "dni": None,
                "haberes": [],
                "descuentos": [],
                "total_haberes": None,
                "total_descuentos": None,
                "total_liquido": None,
            }

            concepto_inicial = str(fila[2]).strip() if len(fila) > 2 and fila[2] else ""
            valor_inicial = parsear_valor(fila[3] if len(fila) > 3 else None)
            if concepto_inicial and limpiar_concepto(concepto_inicial) not in IGNORAR_CONCEPTOS:
                if valor_inicial is not None:
                    emp["haberes"].append({"concepto": concepto_inicial, "monto": valor_inicial})

            seccion = "HABERES"
            i += 1

            while i < n:
                f = filas[i]
                a = str(f[0]).strip() if len(f) > 0 and f[0] else ""
                b = str(f[1]).strip() if len(f) > 1 and f[1] else ""
                c_cell = str(f[2]).strip() if len(f) > 2 and f[2] else ""
                d = parsear_valor(f[3] if len(f) > 3 else None)

                if a == "TOTAL HABERES":
                    emp["total_haberes"] = d
                    i += 1
                    continue
                if a == "TOTAL DESCUENTOS":
                    emp["total_descuentos"] = d
                    i += 1
                    continue
                if a == "TOTAL LIQUIDO":
                    emp["total_liquido"] = d
                    i += 1
                    break

                if a == "DSCTOS":
                    seccion = "DSCTOS"
                    if c_cell and limpiar_concepto(c_cell) not in IGNORAR_CONCEPTOS and d is not None:
                        emp["descuentos"].append({"concepto": c_cell, "monto": d})
                    i += 1
                    continue

                if a == "HABERES" and len(f) > 1 and f[1]:
                    break

                if b:
                    dni_encontrado = extraer_dni(b)
                    if dni_encontrado:
                        emp["dni"] = dni_encontrado
                    elif re.match(r"^(RD|RM|DS|LEY|DL|R\.D\.|R\.M\.)\w*\s*[\d\-./A-Za-z]+", b, re.IGNORECASE):
                        emp["resolucion"] = b
                    elif re.match(r"^uu-", b, re.IGNORECASE):
                        emp["codigo"] = b
                    elif not re.match(r"^(TOTAL|DSCTOS)", b, re.IGNORECASE):
                        if emp["cargo"] is None:
                            emp["cargo"] = b

                if c_cell:
                    nombre_limpio = limpiar_concepto(c_cell)
                    if nombre_limpio not in IGNORAR_CONCEPTOS and not nombre_limpio.startswith("+"):
                        if d is not None:
                            item = {"concepto": c_cell.strip(), "monto": d}
                            if seccion == "HABERES":
                                emp["haberes"].append(item)
                            else:
                                emp["descuentos"].append(item)

                i += 1

            empleados.append(emp)
            continue

        i += 1

    return empleados


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

    mes = request.form.get("mes", type=int)
    anio = request.form.get("anio", type=int)

    if not mes or not anio:
        return jsonify({"error": "Se requieren los campos mes y anio"}), 400
    if not (1 <= mes <= 12):
        return jsonify({"error": "Mes debe estar entre 1 y 12"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        empleados = extraer_empleados(filepath)
        
        analisis = analizar_duplicados(empleados)
        monto_total = calcular_monto_total(empleados)

        payload = {
            "mes": mes,
            "anio": anio,
            "total_empleados": len(empleados),
            "empleados": empleados,
        }

        response = requests.post(
            f"{BACKEND_URL}/api/importar/haberes",
            json=payload,
            timeout=300,
        )

        if response.status_code == 200:
            resp_data = response.json()
            return jsonify({
                "message": "Excel procesado correctamente",
                "personal_creados": resp_data.get("personal_creados", 0),
                "planillas_creadas": resp_data.get("planillas_creadas", 0),
                "personal": len(empleados),
                "planillas": len(empleados),
                "errores": resp_data.get("errores", []),
                "personal_actualizados": resp_data.get("personal_actualizados", 0),
                "dnis_duplicados": analisis["dnis_duplicados"],
                "nombres_duplicados": analisis["nombres_duplicados"],
                "monto_total": monto_total,
                "duplicados": resp_data.get("duplicados", []),
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
        empleados = extraer_empleados(filepath)
        analisis = analizar_duplicados(empleados)
        monto_total = calcular_monto_total(empleados)
        
        return jsonify({
            "valid": True,
            "total_empleados": len(empleados),
            "preview": empleados[:5],
            "dnis_duplicados": analisis["dnis_duplicados"],
            "nombres_duplicados": analisis["nombres_duplicados"],
            "monto_total": monto_total,
        })
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 400
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route("/export-excel", methods=["POST"])
def export_excel():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Se requiere JSON body"}), 400

    personal_id = data.get("personal_id")
    if not personal_id:
        return jsonify({"error": "Se requiere personal_id"}), 400

    mes = data.get("mes")
    anio = data.get("anio")

    params = {}
    if mes:
        params["mes"] = str(mes)
    if anio:
        params["anio"] = str(anio)

    try:
        resp = requests.get(
            f"{BACKEND_URL}/api/personal/{personal_id}/exportar",
            params=params,
            timeout=30,
        )
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error de conexión con el backend: {str(e)}"}), 502

    if resp.status_code != 200:
        return jsonify({"error": "Error al obtener datos del empleado", "details": resp.text}), resp.status_code

    d = resp.json()
    personal = d.get("personal", {})
    planillas = d.get("planillas", [])

    template_path = os.path.join(app.config["UPLOAD_FOLDER"], "plantilla_nueva.xlsx")
    if not os.path.exists(template_path):
        return jsonify({"error": "Plantilla no encontrada en el servidor"}), 500

    try:
        wb = load_workbook(template_path)
    except Exception as e:
        return jsonify({"error": f"Error al cargar plantilla: {str(e)}"}), 500

    ws = wb.active

    # ── Employee info (rows 5–8) ──
    ws["C5"] = f"{personal.get('apellidos', '')}, {personal.get('nombres', '')}".strip(", ")
    ws["C6"] = f"{mes}/{anio}" if mes and anio else ""
    ws["C7"] = personal.get("dni", "")
    ws["K5"] = ""
    ws["K6"] = personal.get("puesto", "")
    ws["K7"] = personal.get("rd", "")
    ws["K8"] = personal.get("uu", "")

    if planillas:
        # ── Collect unique conceptos across all planillas ──
        haberes_conceptos = {}
        descuentos_conceptos = {}
        for p in planillas:
            m, a = p["mes"], p["anio"]
            key = f"{a}-{m}"
            for ing in p.get("ingresos", []):
                t = ing.get("tipo", "").strip()
                if t:
                    if t not in haberes_conceptos:
                        haberes_conceptos[t] = {}
                    haberes_conceptos[t][key] = ing.get("monto", 0)
            for desc in p.get("descuentos", []):
                t = desc.get("tipo", "").strip()
                if t:
                    if t not in descuentos_conceptos:
                        descuentos_conceptos[t] = {}
                    descuentos_conceptos[t][key] = desc.get("monto", 0)

        def mes_a_columna(m):
            return 3 + m

        # ── Fill HABERES (rows 11–24) ──
        haberes_ordenados = sorted(haberes_conceptos.keys())
        for i, concepto in enumerate(haberes_ordenados[:14]):
            row = 11 + i
            ws.cell(row=row, column=1, value=concepto)
            for key, monto in haberes_conceptos[concepto].items():
                _, m = key.split("-")
                col = mes_a_columna(int(m))
                ws.cell(row=row, column=col, value=monto)

        # ── TOTAL HABERES (row 25) ──
        for p in planillas:
            col = mes_a_columna(p["mes"])
            ws.cell(row=25, column=col, value=p.get("total_haberes", 0))

        # ── Fill DESCUENTOS (rows 27–34) ──
        desc_ordenados = sorted(descuentos_conceptos.keys())
        for i, concepto in enumerate(desc_ordenados[:8]):
            row = 27 + i
            ws.cell(row=row, column=1, value=concepto)
            for key, monto in descuentos_conceptos[concepto].items():
                _, m = key.split("-")
                col = mes_a_columna(int(m))
                ws.cell(row=row, column=col, value=monto)

        # ── TOTAL DESCUENTOS (row 35) ──
        for p in planillas:
            col = mes_a_columna(p["mes"])
            ws.cell(row=35, column=col, value=p.get("total_descuentos", 0))

        # ── TOTAL LIQUIDO (row 36) ──
        for p in planillas:
            col = mes_a_columna(p["mes"])
            ws.cell(row=36, column=col, value=p.get("total_liquido", 0))

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    ape = personal.get("apellidos", "").replace(" ", "_")
    nom = personal.get("nombres", "").replace(" ", "_")
    filename = f"Planilla_{ape}_{nom}.xlsx"

    return send_file(
        buf,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081)
