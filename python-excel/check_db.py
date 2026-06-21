import requests

# Check personal
resp = requests.get('http://backend:8080/api/personal', params={'limit': 2000})
if resp.status_code == 200:
    data = resp.json()
    print('Personal pagination:', data.get('pagination'))
    print('Personal count:', len(data.get('data', [])))
else:
    print('Error personal:', resp.text)

# Check planillas for period
resp2 = requests.get('http://backend:8080/api/planillas', params={'mes': 3, 'anio': 1993, 'limit': 2000})
if resp2.status_code == 200:
    data2 = resp2.json()
    print('Planillas pagination:', data2.get('pagination'))
    print('Planillas count:', len(data2.get('data', [])))
else:
    print('Error planillas:', resp2.text)
