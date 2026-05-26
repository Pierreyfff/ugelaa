"""
Herramienta interactiva para probar la extracción de campos desde Excel.

Uso:
    python test_extraction.py                  → abre selector de archivos
    python test_extraction.py <ruta_excel>      → procesa directamente
    python test_extraction.py --raw <ruta>      → salida JSON cruda
"""
import json
import os
import sys
import tkinter as tk
from tkinter import filedialog

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import extraer_empleados, analizar_duplicados, calcular_monto_total


def seleccionar_archivo():
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    archivo = filedialog.askopenfilename(
        title="Seleccionar archivo Excel",
        filetypes=[("Archivos Excel", "*.xlsx *.xls"), ("Todos", "*.*")],
    )
    root.destroy()
    return archivo if archivo else None


def formatear_moneda(valor):
    if valor is None:
        return "S/ 0.00"
    return f"S/ {valor:,.2f}"


def mostrar_empleado(emp, idx):
    print()
    print("=" * 70)
    print(f"  EMPLEADO #{idx + 1}")
    print("=" * 70)

    nombre = emp.get("nombre", "") or ""
    print(f"  Nombre        : {nombre}")

    institucion = emp.get("institucion")
    print(f"  Institución   : {institucion or '(vacio)'}")

    distrito = emp.get("distrito")
    if distrito:
        print(f"  Distrito      : ✔ {distrito}")
    else:
        print(f"  Distrito      : ✗ (vacio)")

    cargo = emp.get("cargo")
    print(f"  Cargo         : {cargo or '(vacio)'}")

    resolucion = emp.get("resolucion")
    print(f"  Resolución    : {resolucion or '(vacio)'}")

    codigo = emp.get("codigo")
    print(f"  Código        : {codigo or '(vacio)'}")

    dni = emp.get("dni")
    print(f"  DNI           : {dni or '(vacio)'}")

    haberes = emp.get("haberes", [])
    descuentos = emp.get("descuentos", [])

    print(f"\n  {'─' * 50}")
    print(f"  HABERES ({len(haberes)} items):")
    if haberes:
        for h in haberes:
            concepto = h.get("concepto", "")
            monto = h.get("monto", 0)
            print(f"    {concepto:<25} {formatear_moneda(monto)}")
    else:
        print("    (sin haberes)")

    print(f"\n  DESCUENTOS ({len(descuentos)} items):")
    if descuentos:
        for d in descuentos:
            concepto = d.get("concepto", "")
            monto = d.get("monto", 0)
            print(f"    {concepto:<25} {formatear_moneda(monto)}")
    else:
        print("    (sin descuentos)")

    total_haberes = emp.get("total_haberes")
    total_descuentos = emp.get("total_descuentos")
    total_liquido = emp.get("total_liquido")

    print(f"\n  {'─' * 50}")
    print(f"  TOTAL HABERES    : {formatear_moneda(total_haberes)}")
    print(f"  TOTAL DESCUENTOS : {formatear_moneda(total_descuentos)}")
    print(f"  TOTAL LIQUIDO    : {formatear_moneda(total_liquido)}")
    print()


def main():
    raw_output = "--raw" in sys.argv

    # Determinar archivo
    if len(sys.argv) >= 2 and not sys.argv[1].startswith("--"):
        filepath = sys.argv[1]
    elif raw_output and len(sys.argv) >= 3:
        filepath = sys.argv[2]
    else:
        print("Selecciona el archivo Excel...")
        filepath = seleccionar_archivo()
        if not filepath:
            print("No se seleccionó ningún archivo.")
            sys.exit(1)

    if not os.path.exists(filepath):
        print(f"Error: archivo no encontrado: {filepath}")
        sys.exit(1)

    ext = os.path.splitext(filepath)[1].lower()
    if ext not in (".xlsx", ".xls"):
        print(f"Error: solo archivos Excel (.xlsx, .xls), recibido: {ext}")
        sys.exit(1)

    print(f"\n  Procesando: {os.path.basename(filepath)}")
    print("=" * 70)

    try:
        empleados = extraer_empleados(filepath)

        if raw_output:
            print(json.dumps(empleados, indent=2, ensure_ascii=False))
            return

        print(f"\n  Total empleados encontrados: {len(empleados)}")

        for idx, emp in enumerate(empleados):
            mostrar_empleado(emp, idx)

        analisis = analizar_duplicados(empleados)
        monto_total = calcular_monto_total(empleados)

        print("=" * 70)
        print("  RESUMEN GENERAL")
        print("=" * 70)
        print(f"  Total empleados : {len(empleados)}")
        print(f"  Monto total     : {formatear_moneda(monto_total)}")

        if analisis["dnis_duplicados"]:
            print(f"\n  ⚠  DNIs duplicados: {len(analisis['dnis_duplicados'])}")
            for d in analisis["dnis_duplicados"]:
                print(f"      - DNI {d['dni']} aparece {d['count']} veces")

        if analisis["nombres_duplicados"]:
            print(f"\n  ⚠  Nombres duplicados: {len(analisis['nombres_duplicados'])}")
            for n in analisis["nombres_duplicados"]:
                print(f"      - '{n['nombre']}' aparece {n['count']} veces")

        print()

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
