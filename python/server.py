#!/usr/bin/env python3
import os
import json
import uuid
import tempfile
from flask import Flask, request, jsonify
from procesar_xls import parse_xls

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/procesar', methods=['POST'])
def procesar():
    if 'file' not in request.files:
        return jsonify({"error": "No se recibió archivo"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Archivo vacío"}), 400
    
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['xls', 'xlsx']:
        return jsonify({"error": "Solo se aceptan archivos XLS o XLSX"}), 400
    
    with tempfile.TemporaryDirectory() as tmpdir:
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(tmpdir, filename)
        file.save(filepath)
        
        try:
            result = parse_xls(filepath)
            
            if "error" in result:
                return jsonify(result), 500
                
            return jsonify({
                "success": True,
                "workers": result,
                "total": len(result)
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)