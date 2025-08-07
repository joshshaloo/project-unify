# Soccer Project Unify - Developer Makefile
# =========================================
# Simple, intuitive commands for common developer tasks
# Everything else handled behind the scenes

# Configuration
SHELL := /bin/bash
.DEFAULT_GOAL := help

# Colors (use printf for compatibility)
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m
BOLD := \033[1m
PRINT := printf

# Project settings
REGISTRY := ghcr.io
IMAGE_NAME := $(REGISTRY)/joshshaloo/soccer/project-unify
GIT_SHA := $(shell git rev-parse --short HEAD)
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)

# Determine image tag (always use commit SHA)
TAG ?= $(GIT_SHA)

#
# 📚 Help
#

## help: Show available commands
.PHONY: help
help:
	@$(PRINT) "\n"
	@$(PRINT) "$(BOLD)$(CYAN)⚽ Soccer Project Unify$(NC)\n"
	@$(PRINT) "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)\n"
	@$(PRINT) "\n"
	@$(PRINT) "$(BOLD)Daily Development$(NC)\n"
	@$(PRINT) "  $(GREEN)make dev$(NC)            - Start everything locally\n"
	@$(PRINT) "  $(GREEN)make stop$(NC)           - Stop everything\n"
	@$(PRINT) "  $(GREEN)make logs$(NC)           - View logs (use s=service for specific)\n"
	@$(PRINT) "  $(GREEN)make test$(NC)           - Run tests in Docker\n"
	@$(PRINT) "  $(GREEN)make test-e2e$(NC)       - Run E2E tests locally\n"
	@$(PRINT) "\n"
	@$(PRINT) "$(BOLD)Before Pushing Code$(NC)\n"
	@$(PRINT) "  $(GREEN)make validate$(NC)       - Run all CI checks locally\n"
	@$(PRINT) "\n"
	@$(PRINT) "$(BOLD)Utilities$(NC)\n"
	@$(PRINT) "  $(GREEN)make db$(NC)             - Connect to database\n"
	@$(PRINT) "  $(GREEN)make shell$(NC)          - Enter container shell\n"
	@$(PRINT) "  $(GREEN)make clean$(NC)          - Clean up resources\n"
	@$(PRINT) "\n"
	@$(PRINT) "$(BOLD)Deployment (Usually Automatic)$(NC)\n"
	@$(PRINT) "  $(GREEN)make deploy-preview$(NC) - Deploy to preview (needs TAG=...)\n"
	@$(PRINT) "  $(GREEN)make deploy-prod$(NC)    - Deploy to production (needs TAG=...)\n"
	@$(PRINT) "\n"

#
# 🚀 Daily Development
#

## dev: Start everything locally
.PHONY: dev
dev:
	@$(PRINT) "$(CYAN)🚀 Starting development environment...$(NC)\n"
	@docker compose -f docker-compose.dev.yml up -d --build
	@$(PRINT) "\n"
	@$(PRINT) "$(GREEN)✓ Development environment started!$(NC)\n"
	@$(PRINT) "\n"
	@$(PRINT) "$(CYAN)🌐 Application: http://localhost:3001$(NC)\n"
	@$(PRINT) "$(CYAN)📧 MailHog: http://localhost:8025$(NC)\n"
	@$(PRINT) "$(CYAN)🔄 n8n: http://localhost:5678$(NC)\n"
	@$(PRINT) "\n"
	@$(PRINT) "$(YELLOW)View logs with: make logs$(NC)\n"

## stop: Stop everything
.PHONY: stop
stop:
	@$(PRINT) "$(YELLOW)🛑 Stopping development environment...$(NC)\n"
	@docker compose -f docker-compose.dev.yml down
	@pkill -f "next dev" 2>/dev/null || true
	@$(PRINT) "$(GREEN)✓ Stopped$(NC)\n"

## logs: View logs (use s=service for specific service)
.PHONY: logs
logs:
ifdef s
	@docker compose -f docker-compose.dev.yml logs -f $(s)
else
	@docker compose -f docker-compose.dev.yml logs -f
endif

## test: Run tests in Docker
.PHONY: test
test:
	@$(PRINT) "$(CYAN)🧪 Running tests in Docker...$(NC)\n"
	@docker build --platform linux/amd64 --target tester \
		--build-arg DATABASE_URL="postgresql://postgres:password@localhost:5432/test" \
		--build-arg NEXTAUTH_SECRET="test-secret" \
		--build-arg NEXTAUTH_URL="http://localhost:3000" \
		-t test-runner . && \
	docker rmi test-runner >/dev/null 2>&1
	@$(PRINT) "$(GREEN)✓ Tests completed$(NC)\n"

## test-local: Run tests on host (faster)
.PHONY: test-local
test-local:
	@$(PRINT) "$(CYAN)🧪 Running tests locally...$(NC)\n"
	@cd apps/web && pnpm test

## test-e2e: Run E2E tests locally
.PHONY: test-e2e
test-e2e:
	@$(PRINT) "$(CYAN)🧪 Running E2E tests locally...$(NC)\n"
	@$(PRINT) "$(YELLOW)Checking local services...$(NC)\n"
	@if ! docker ps | grep -q postgres; then \
		$(PRINT) "$(YELLOW)Starting PostgreSQL...$(NC)\n"; \
		docker run -d --name postgres-test -e POSTGRES_PASSWORD=localpassword -e POSTGRES_DB=soccer -p 5433:5432 postgres:15-alpine; \
		sleep 3; \
	fi
	@if ! docker ps | grep -q mailhog; then \
		$(PRINT) "$(YELLOW)Starting MailHog...$(NC)\n"; \
		docker run -d --name mailhog-test -p 8025:8025 -p 1025:1025 mailhog/mailhog; \
		sleep 2; \
	fi
	@$(PRINT) "$(GREEN)✓ Services ready$(NC)\n"
	@cd apps/web && pnpm test:e2e --reporter=list

## test-preview: Run e2e tests against preview environment
.PHONY: test-preview
test-preview:
	@$(PRINT) "$(CYAN)🧪 Running E2E tests against preview environment...$(NC)\n"
	@$(PRINT) "$(YELLOW)Target: https://preview.clubomatic.ai$(NC)\n"
	@$(PRINT) "$(YELLOW)MailHog: https://soccer-preview-ts.rockhopper-crested.ts.net/mailhog/$(NC)\n"
	@cd apps/web && TEST_ENV=preview MAILHOG_URL=https://soccer-preview-ts.rockhopper-crested.ts.net/mailhog NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm playwright test --config=playwright.config.preview.ts --reporter=list

#
# ✅ Validation
#

## validate: Run all CI checks locally (same as GitHub Actions)
.PHONY: validate
validate:
	@$(PRINT) "$(CYAN)🔍 Running CI validation locally...$(NC)\n"
	@$(PRINT) "This runs the same checks as GitHub Actions\n"
	@$(PRINT) "\n"
	@docker build --platform linux/amd64 --target tester \
		--build-arg DATABASE_URL="postgresql://postgres:password@localhost:5432/test" \
		--build-arg NEXTAUTH_SECRET="test-secret" \
		--build-arg NEXTAUTH_URL="http://localhost:3000" \
		-t $(IMAGE_NAME):validate-$(GIT_SHA) . && \
	echo "$(GREEN)✅ All validation checks passed!$(NC)" && \
	docker rmi $(IMAGE_NAME):validate-$(GIT_SHA) >/dev/null 2>&1 || \
	(echo "$(RED)❌ Validation failed!$(NC)" && exit 1)

#
# 🛠️ Utilities
#

## db: Connect to database
.PHONY: db
db:
	@$(PRINT) "$(CYAN)🗄️  Connecting to database...$(NC)\n"
	@docker exec -it $$(docker ps -qf "name=postgres") psql -U postgres soccer

## shell: Enter container shell
.PHONY: shell
shell:
	@$(PRINT) "$(CYAN)🐚 Entering shell...$(NC)\n"
ifdef s
	@docker exec -it $$(docker ps -qf "name=$(s)") /bin/sh
else
	@docker exec -it $$(docker ps -qf "name=web") /bin/sh
endif

## docker-login: Login to GitHub Container Registry
.PHONY: docker-login
docker-login:
	@$(PRINT) "$(CYAN)🔐 Logging into GitHub Container Registry...$(NC)\n"
	@if [ -f .env ]; then \
		export $$(grep -v '^#' .env | xargs) && \
		echo "$${GITHUB_TOKEN}" | docker login ghcr.io -u "$${GITHUB_USER}" --password-stdin; \
	else \
		echo "$${GITHUB_TOKEN}" | docker login ghcr.io -u "$${GITHUB_USER}" --password-stdin; \
	fi
	@$(PRINT) "$(GREEN)✓ Login successful$(NC)\n"

## clean: Clean up resources
.PHONY: clean
clean:
	@$(PRINT) "$(YELLOW)🧹 Cleaning up...$(NC)\n"
	@docker compose -f docker-compose.dev.yml down -v
	@docker system prune -f
	@$(PRINT) "$(GREEN)✓ Cleaned$(NC)\n"

#
# 🚢 Build & Deploy
#

## build: Build Docker image
.PHONY: build
build:
	@$(PRINT) "$(CYAN)🔨 Building Docker image...$(NC)\n"
	@$(PRINT) "Tag: $(IMAGE_NAME):$(TAG)\n"
	@docker build --platform linux/amd64 -t $(IMAGE_NAME):$(TAG) .
	@$(PRINT) "$(GREEN)✓ Build complete$(NC)\n"

## push: Push Docker image
.PHONY: push
push:
	@$(PRINT) "$(CYAN)📤 Pushing Docker image...$(NC)\n"
	@docker push $(IMAGE_NAME):$(TAG)
	@$(PRINT) "$(GREEN)✓ Push complete$(NC)\n"

## build-and-push: Build and push Docker image
.PHONY: build-and-push
build-and-push: build push
	@$(PRINT) "$(GREEN)✓ Build and push complete$(NC)\n"

## deploy-preview: Build, push and deploy to preview environment
.PHONY: deploy-preview
deploy-preview: build-and-push
	@$(PRINT) "$(CYAN)🚀 Deploying to preview environment...$(NC)\n"
	@python3 scripts/portainer_deploy.py deploy preview $(TAG)

## deploy-prod: Build, push and deploy to production
.PHONY: deploy-prod
deploy-prod: build-and-push
	@$(PRINT) "$(CYAN)🚀 Deploying to production...$(NC)\n"
	@python3 scripts/portainer_deploy.py deploy prod $(TAG)

#
# 🔧 Advanced (Hidden from main help)
#

## bootstrap-preview: Create initial preview stack in Portainer
.PHONY: bootstrap-preview
bootstrap-preview: build-and-push
	@$(PRINT) "$(CYAN)🚀 Creating preview stack in Portainer...$(NC)\n"
	@python3 scripts/portainer_deploy.py bootstrap preview $(GIT_SHA)

## bootstrap-prod: Create initial production stack in Portainer
.PHONY: bootstrap-prod
bootstrap-prod: build-and-push
	@python3 scripts/portainer_deploy.py bootstrap prod $(GIT_SHA)

## portainer-test: Test Portainer API connection
.PHONY: portainer-test
portainer-test:
	@python3 scripts/portainer_deploy.py test

## portainer-status: Show deployed stacks status
.PHONY: portainer-status
portainer-status:
	@python3 scripts/portainer_deploy.py status

## status: Show running containers
.PHONY: status
status:
	@docker compose -f docker-compose.dev.yml ps

## migrate: Run database migrations
.PHONY: migrate
migrate:
	@$(PRINT) "$(CYAN)🔄 Running migrations...$(NC)\n"
	@cd apps/web && pnpm db:migrate:deploy

## seed: Seed database
.PHONY: seed  
seed:
	@$(PRINT) "$(CYAN)🌱 Seeding database...$(NC)\n"
	@cd apps/web && pnpm db:seed

## typecheck: Run TypeScript type checking
.PHONY: typecheck
typecheck:
	@pnpm typecheck

## lint: Run linter
.PHONY: lint
lint:
	@pnpm lint