# syntax=docker/dockerfile:1

# =========================================================================
# Stage 1: Builder
# =========================================================================
FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies (assume requirements.txt exists)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy source code and compile .pyc for faster boot
COPY . .
RUN python -m compileall app/


# =========================================================================
# Stage 2A: Development Environment (python:3.11-slim)
# =========================================================================
FROM python:3.11-slim AS dev

# Keep curl for healthchecks and bash for `make shell`
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Add non-root user
RUN groupadd -g 1000 safecred && useradd -u 1000 -g safecred -s /bin/bash -m safecred

WORKDIR /app

# Copy VENV from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Code from builder
COPY --from=builder --chown=safecred:safecred /app /app

USER safecred
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


# =========================================================================
# Stage 2B: Production Environment (distroless/python3)
# =========================================================================
FROM gcr.io/distroless/python3-debian12 AS prod

WORKDIR /app

# Copy VENV from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Compiled Code from builder
COPY --from=builder /app /app

# Distroless has a built-in 'nonroot' user (uid 65532)
USER nonroot

EXPOSE 8000

# Must use exec array syntax as there is no shell parsing in Distroless
CMD ["/opt/venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
