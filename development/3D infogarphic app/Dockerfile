FROM python:3.11-slim

WORKDIR /app

COPY backend/parser/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

EXPOSE 8000

CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]