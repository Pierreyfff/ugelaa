import pandas as pd
df = pd.read_excel('Constancia de haberes 1993.xls', sheet_name=None)
for name, sheet in df.items():
    print(f'Sheet: {name}')
    print(sheet.iloc[55:70].to_string())
    print('\n' + '='*50 + '\n')