# backend/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# System deps: Tesseract OCR + language packs + PDF libs + TeX-Live für xelatex
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-deu \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libmagic1 \
    texlive-xetex \
    texlive-lang-german \
    texlive-latex-extra \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
RUN pip install hatch
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

FROM base AS production
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM production AS development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
