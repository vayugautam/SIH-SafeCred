# Stage 1: Builder
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=0
ENV PYTHONUNBUFFERED=1

WORKDIR /build

# Install dependencies into a separate prefix
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Copy application code and compile
COPY app/ ./app/
# Pre-compile Python source to bytecode
RUN python -m compileall app/

# Stage 2: Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install OS dependencies for OCR and ML models
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Configure python path to find packages copied from the builder stage
ENV PYTHONPATH=/usr/local/lib/python3.11/site-packages:/app
ENV PYTHONUNBUFFERED=1

# Copy built dependencies
COPY --from=builder /install /usr/local
# Copy application bytecode
COPY --from=builder /build/app /app/app

# Enforce non-root execution
RUN useradd -m nonroot && chown -R nonroot:nonroot /app
USER nonroot

EXPOSE 8000

# Executing via python -m ensures paths resolve correctly
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
