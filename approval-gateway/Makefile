.PHONY: install run test lint format clean help

# Python and pip
PYTHON := python3
PIP := $(PYTHON) -m pip
PYTEST := $(PYTHON) -m pytest
UVICORN := $(PYTHON) -m uvicorn

help: ## Show this help message
	@echo "BrandPilot Approval Gateway - Makefile Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

install: ## Install dependencies
	$(PIP) install -r requirements.txt

run: ## Run the FastAPI server
	$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8080

test: ## Run tests
	$(PYTEST) tests/ -v

test-cov: ## Run tests with coverage
	$(PYTEST) tests/ -v --cov=app --cov-report=html --cov-report=term

lint: ## Run linter (ruff)
	$(PYTHON) -m ruff check app/ tests/ tools/

format: ## Format code (black + ruff)
	$(PYTHON) -m black app/ tests/ tools/
	$(PYTHON) -m ruff check --fix app/ tests/ tools/

typecheck: ## Run type checker (mypy)
	$(PYTHON) -m mypy app/ --ignore-missing-imports

clean: ## Clean generated files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

seed: ## Seed a demo candidate
	$(PYTHON) tools/seed_candidate.py

seed-multi: ## Seed 5 demo candidates
	$(PYTHON) tools/seed_candidate.py --count 5

dev: install ## Setup development environment
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Copy env.example to .env and configure"
	@echo "  2. Start Redis: docker run -d -p 6379:6379 redis"
	@echo "  3. Run server: make run"
	@echo "  4. Test: make seed"
	@echo ""

docker-redis: ## Start Redis in Docker
	docker run -d --name brandpilot-redis -p 6379:6379 redis:7-alpine

docker-redis-stop: ## Stop Redis Docker container
	docker stop brandpilot-redis && docker rm brandpilot-redis

