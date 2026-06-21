from app import extraer_empleados
empleados = extraer_empleados('C:/Users/Maria/ugelaa/python-excel/uploads/Constancia de haberes 1993_marzo.xls')
print(f'Total: {len(empleados)}')

# Check for entries with same DNI+name
seen = set()
dup_count = 0
for emp in empleados:
    dni = emp.get('dni', '')
    name = emp.get('nombre', '')
    key = (dni, name)
    if key in seen:
        dup_count += 1
    else:
        seen.add(key)

print(f'Unique (DNI+name): {len(seen)}')
print(f'Duplicates (DNI+name): {dup_count}')
print(f'Expected planillas: {len(seen)}')

# Also check DNI only uniqueness
seen_dni = set()
dup_dni = 0
for emp in empleados:
    dni = emp.get('dni', '')
    if dni in seen_dni:
        dup_dni += 1
    else:
        seen_dni.add(dni)
print(f'\nUnique DNIs: {len(seen_dni)}')
print(f'Duplicate DNIs: {dup_dni}')
