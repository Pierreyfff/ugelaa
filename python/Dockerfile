FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir pandas openpyxl xlrd gunicorn flask

COPY procesar_xls.py /app/
COPY server.py /app/

EXPOSE 5000

CMD ["python", "server.py"]