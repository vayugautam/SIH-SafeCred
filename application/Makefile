.PHONY: build up down logs migrate seed-data test lint format shell

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down -v

logs:
	docker-compose logs -f

migrate:
	docker-compose exec api python -m app.db.migrate

seed-data:
	docker-compose exec api python -m app.db.seed

test:
	docker-compose exec api pytest

lint:
	docker-compose exec api flake8 .

format:
	docker-compose exec api black .

shell:
	docker-compose exec api /bin/sh
