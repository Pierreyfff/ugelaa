import requests

# Check personal count
resp = requests.get('http://backend:8080/api/personal', params={'limit': 2000, 'page': 1})
print('Personal status:', resp.status_code)
data = resp.json()
print('Personal keys:', list(data.keys()))
if 'pagination' in data:
    print('Pagination:', data['pagination'])
if 'total' in data:
    print('Total:', data['total'])
print('Data length:', len(data.get('data', [])))

# Check planillas
resp2 = requests.get('http://backend:8080/api/planillas', params={'limit': 2000, 'page': 1})
print()
print('Planillas status:', resp2.status_code)
data2 = resp2.json()
print('Planillas keys:', list(data2.keys()))
if 'pagination' in data2:
    print('Planillas pagination:', data2['pagination'])
if 'total' in data2:
    print('Planillas total:', data2['total'])
print('Data length:', len(data2.get('data', [])))
