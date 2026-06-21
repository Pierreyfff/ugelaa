from app import extraer_empleados, _leer_filas

empleados = extraer_empleados('C:/Users/Maria/ugelaa/python-excel/uploads/Constancia de haberes 1993_marzo.xls')
print(f'Total: {len(empleados)}')

# Check for any unusual names
problems = []
for i, emp in enumerate(empleados):
    name = emp.get('nombre', '')
    dni = emp.get('dni')
    cargo = emp.get('cargo')
    resolucion = emp.get('resolucion')
    codigo = emp.get('codigo')
    
    # Check for missing data
    issues = []
    if not name:
        issues.append('sin nombre')
    if not dni:
        issues.append('sin DNI')
    if not cargo:
        issues.append('sin cargo')
    if not resolucion:
        issues.append('sin RD')
    if not codigo:
        issues.append('sin UU')
    
    if issues:
        problems.append((i+1, name, issues))

print(f'\nEmpleados con problemas: {len(problems)}')
for idx, name, issues in problems[:30]:
    print(f'  #{idx}: {name or "(vacio)"} - {issues}')

# Also check total_haberes, total_descuentos, total_liquido
missing_totals = sum(1 for e in empleados if not e.get('total_liquido'))
print(f'\nEmpleados sin TOTAL LIQUIDO: {missing_totals}')

# Check for duplicate names
from collections import Counter
name_counts = Counter(e['nombre'] for e in empleados if e.get('nombre'))
dupes = [(n, c) for n, c in name_counts.items() if c > 1]
print(f'\nNombres duplicados: {len(dupes)}')
for n, c in dupes[:10]:
    print(f'  {n}: {c} veces')
