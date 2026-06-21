import requests

# Clean
resp = requests.delete('http://backend:8080/api/importar/limpiar', params={'mes': 3, 'anio': 1993})
print('Clean:', resp.status_code)
if resp.status_code == 200:
    print('  Planillas eliminadas:', resp.json().get('planillas_eliminadas'))

# Re-import
from app import extraer_empleados
empleados = extraer_empleados('/app/uploads/Constancia de haberes 1993_marzo.xls')
print('Extraidos:', len(empleados))

payload = {
    'mes': 3,
    'anio': 1993,
    'total_empleados': len(empleados),
    'empleados': empleados
}

resp2 = requests.post('http://backend:8080/api/importar/haberes', json=payload, timeout=600)
print('Import status:', resp2.status_code)
data = resp2.json()
print('personal_creados:', data.get('personal_creados'))
print('planillas_creadas:', data.get('planillas_creadas'))
print('total_empleados:', data.get('total_empleados'))
print('warnings count:', len(data.get('errores', [])))
print('duplicados count:', len(data.get('duplicados', [])))
if data.get('duplicados'):
    for d in data['duplicados'][:5]:
        print('  DUPLICADO:', d)
if data.get('errores'):
    for e in data['errores'][:5]:
        print('  WARNING:', e)
