#!/usr/bin/env python3
import sys
import json
import pandas as pd
import re
from pathlib import Path

def extract_dni_from_name(nombre, row=None):
    if not nombre:
        return ""
    
    if "DNI" in nombre.upper():
        match = re.search(r'(\d{7,9})', nombre)
        if match:
            return match.group(1)
    
    parts = nombre.split()
    for p in parts:
        cleaned = re.sub(r'[^\d]', '', p)
        if len(cleaned) >= 8:
            return cleaned
    
    match = re.search(r'(\d{7,9})', nombre)
    if match:
        return match.group(1)
    
    return ""

def parse_xls(file_path):
    try:
        df = pd.read_excel(file_path, sheet_name=None, engine='xlrd')
        sheet = list(df.values())[0]
        rows = sheet.values.tolist()
        
        workers = []
        current_worker = None
        
        for i in range(len(rows)):
            row = rows[i]
            if len(row) < 4:
                continue
            
            col0 = str(row[0]).strip() if pd.notna(row[0]) else ""
            col1 = str(row[1]).strip() if pd.notna(row[1]) else ""
            col2 = str(row[2]).strip() if pd.notna(row[2]) else ""
            col3 = row[3]
            
            meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
                     "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
            
            if col2 == "DETALLE" and any(m in col3.upper() for m in meses):
                if current_worker and "nombre" in current_worker:
                    workers.append(current_worker)
                current_worker = {"ingresos": [], "descuentos": []}
                
            elif col0 == "HABERES" and col1 and "TOTAL" not in col1:
                current_worker["nombre"] = col1
                current_worker["dni"] = extract_dni_from_name(col1)
            
            if current_worker:
                for col_val in row:
                    if pd.notna(col_val):
                        col_str = str(col_val).strip()
                        if col_str.upper().startswith("DNI"):
                            dni_match = re.search(r'(\d{7,9})', col_str)
                            if dni_match:
                                current_worker["dni"] = dni_match.group(1)
                
            elif col0 == "HABERES" and col2 == "BASICA":
                current_worker["basica"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "BASICA", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "PERSONAL":
                current_worker["personal"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "PERSONAL", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif "DL" in col2 and len(col2) <= 7:
                current_worker["dl_asig"] = float(col3) if pd.notna(col3) else 60
                current_worker["ingresos"].append({"tipo": "DL_ASIG", "monto": float(col3) if pd.notna(col3) else 60})
                
            elif col2 == "TPH":
                current_worker["tph"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "TPH", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col1 and col2 == "Diferencial":
                current_worker["cargo"] = col1
                current_worker["diferencial"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "DIFERENCIAL", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "Familia":
                current_worker["familia"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "FAMILIA", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col1 and col2 == "REF.MOV":
                current_worker["rd"] = col1
                current_worker["ref_mov"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "REF_MOV", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "DS 021":
                current_worker["ds_021"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "DS_021", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col1 and col2 == "PREP. CLAS":
                current_worker["uu"] = col1
                current_worker["prep_clas"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "PREP_CLAS", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "REUNIFICA":
                current_worker["reunifica"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "REUNIFICA", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "IGV":
                current_worker["igv"] = float(col3) if pd.notna(col3) else 0
                current_worker["ingresos"].append({"tipo": "IGV", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col0 == "DSCTOS" and col2 == "DL20530":
                current_worker["dl20530"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "DL20530", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "SEG.SOC":
                current_worker["seg_soc"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "SEG_SOC", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "DRR. AD":
                current_worker["drr_ad"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "DRR_AD", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "DRR. MAG":
                current_worker["drr_mag"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "DRR_MAG", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif "Desc. Judicial" in col2:
                current_worker["desc_judicial"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "DESC_JUDICIAL", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "COOP":
                current_worker["coop"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "COOP", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "FONAVI":
                current_worker["fonavi"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "FONAVI", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "Sindicato":
                current_worker["sindicato"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "SINDICATO", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col2 == "ptm":
                current_worker["ptm"] = float(col3) if pd.notna(col3) else 0
                current_worker["descuentos"].append({"tipo": "PTM", "monto": float(col3) if pd.notna(col3) else 0})
                
            elif col0 == "TOTAL HABERES":
                current_worker["total_haberes"] = float(col3) if pd.notna(col3) else 0
                
            elif col0 == "TOTAL DESCUENTOS":
                current_worker["total_descuentos"] = float(col3) if pd.notna(col3) else 0
                
            elif col0 == "TOTAL LIQUIDO":
                current_worker["total_liquido"] = float(col3) if pd.notna(col3) else 0
                
        if current_worker and "nombre" in current_worker:
            workers.append(current_worker)
        
        print(f"[DEBUG] Total workers: {len(workers)}", flush=True)
        for i, w in enumerate(workers):
            print(f"[DEBUG] Worker {i}: nombre={w.get('nombre', 'N/A')}, dni={w.get('dni', 'N/A')}", flush=True)
            
        return workers
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Archivo no especificado"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(json.dumps({"error": f"Archivo no encontrado: {file_path}"}))
        sys.exit(1)
    
    result = parse_xls(file_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))