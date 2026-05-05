import pandas as pd
import numpy as np

df = pd.read_excel('Constancia de haberes 1993.xls', sheet_name=None)

for name, sheet in df.items():
    print(f"=== Sheet: {name} ===")
    print(f"Shape: {sheet.shape}")
    print("\nPrimeras 40 filas:")
    for i in range(40):
        row = sheet.iloc[i]
        if not row.isna().all():
            print(f"Row {i}: {row.values}")
    print("\n" + "="*50 + "\n")