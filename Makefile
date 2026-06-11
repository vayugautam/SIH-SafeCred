.PHONY: build up down logs shell migrate seed-data test lint format prod-up

# ==========================================
# DOCKER COMPOSE AUTOMATION
# ==========================================

build:
	@echo "Building local development images (python:3.11-slim)..."
	docker compose build

up:
	@echo "Starting full SafeCred stack in development mode..."
	docker compose up -d

down:
	@echo "Tearing down stack..."
	docker compose down

logs:
	docker compose logs -f

prod-up:
	@echo "Starting full SafeCred stack in PRODUCTION mode (Distroless)..."
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# ==========================================
# DEVELOPER ERGONOMICS
# ==========================================

shell:
	@echo "Attempting to attach shell to the API container..."
	@echo "Note: If running the Production Distroless image, this will intentionally fail."
	docker exec -it safecred_api sh || docker exec -it safecred_api bash

# ==========================================
# DATABASE AUTOMATION
# ==========================================

migrate:
	@echo "Running PostgreSQL Migrations..."
	docker exec -it safecred_api bash -c "alembic upgrade head"

seed-data:
	@echo "Injecting Mock Beneficiary Data..."
	docker exec -it safecred_api bash -c "python scripts/seed.py"

# ==========================================
# QA & TESTING
# ==========================================

test:
	@echo "Running Pytest suite inside API container..."
	docker exec -it safecred_api bash -c "pytest -v"

lint:
	@echo "Running Ruff Linter..."
	docker exec -it safecred_api bash -c "ruff check ."

format:
	@echo "Running Black Formatter..."
	docker exec -it safecred_api bash -c "black ."
