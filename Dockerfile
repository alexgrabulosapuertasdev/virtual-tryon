FROM python:3.10-slim

WORKDIR /app

# Dependencias del sistema (OpenCV + mediapipe suelen necesitarlas)
RUN apt-get update && apt-get install -y \
  libgl1 \
  libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY run.py .
COPY main.py .
COPY frontend ./frontend
COPY backend-api ./backend-api

EXPOSE 8000

CMD ["python", "run.py"]