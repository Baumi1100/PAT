# backend/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# System deps: Tesseract OCR + language packs + PDF libs + TeX-Live für xelatex
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-deu \
    libgl1 \
    libglib2.0-0 \
    libmagic1 \
    texlive-xetex \
    texlive-lang-german \
    texlive-latex-extra \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
RUN pip install hatch hatchling
COPY pyproject.toml .
COPY app ./app
RUN pip install --no-cache-dir ".[dev]"

FROM base AS production
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM production AS development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
