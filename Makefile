# Soccer Project Unify - Developer Makefile
# =========================================
# Simple, intuitive commands for common developer tasks
# Everything else handled behind the scenes

# Configuration
SHELL := /bin/bash
.DEFAULT_GOAL := help

# Colors
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m
BOLD := \033[1m

# Project settings
REGISTRY := ghcr.io
IMAGE_NAME := $(REGISTRY)/joshshaloo/soccer/project-unify
GIT_SHA := $(shell git rev-parse --short HEAD)
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)

# Determine image tag
TAG ?= $(GIT_BRANCH)-$(GIT_SHA)

#
# 📚 Help
#

## help: Show available commands
.PHONY: help
help:
	@echo ""
	@echo "$(BOLD)$(CYAN)⚽ Soccer Project Unify$(NC)"
	@echo "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(BOLD)Daily Development$(NC)"
	@echo "  $(GREEN)make dev$(NC)            - Start everything locally"
	@echo "  $(GREEN)make stop$(NC)           - Stop everything"
	@echo "  $(GREEN)make logs$(NC)           - View logs (use s=service for specific)"
	@echo "  $(GREEN)make test$(NC)           - Run tests in Docker"
	@echo ""
	@echo "$(BOLD)Before Pushing Code$(NC)"
	@echo "  $(GREEN)make validate$(NC)       - Run all CI checks locally"
	@echo ""
	@echo "$(BOLD)Utilities$(NC)"
	@echo "  $(GREEN)make db$(NC)             - Connect to database"
	@echo "  $(GREEN)make shell$(NC)          - Enter container shell"
	@echo "  $(GREEN)make clean$(NC)          - Clean up resources"
	@echo ""
	@echo "$(BOLD)Deployment (Usually Automatic)$(NC)"
	@echo "  $(GREEN)make deploy-preview$(NC) - Deploy to preview (needs TAG=...)"
	@echo "  $(GREEN)make deploy-prod$(NC)    - Deploy to production (needs TAG=...)"
	@echo ""

#
# 🚀 Daily Development
#

## dev: Start everything locally
.PHONY: dev
dev:
	@echo "$(CYAN)🚀 Starting development environment...$(NC)"
	@docker compose -f docker-compose.dev.yml up -d --build
	@echo ""
	@echo "$(GREEN)✓ Development environment started!$(NC)"
	@echo ""
	@echo "$(CYAN)🌐 Application: http://localhost:3001$(NC)"
	@echo "$(CYAN)📧 MailHog: http://localhost:8025$(NC)"
	@echo "$(CYAN)🔄 n8n: http://localhost:5678$(NC)"
	@echo ""
	@echo "$(YELLOW)View logs with: make logs$(NC)"

## stop: Stop everything
.PHONY: stop
stop:
	@echo "$(YELLOW)🛑 Stopping development environment...$(NC)"
	@docker compose -f docker-compose.dev.yml down
	@pkill -f "next dev" 2>/dev/null || true
	@echo "$(GREEN)✓ Stopped$(NC)"

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
	@echo "$(CYAN)🧪 Running tests in Docker...$(NC)"
	@docker build --target tester \
		--build-arg DATABASE_URL="postgresql://postgres:password@localhost:5432/test" \
		--build-arg NEXTAUTH_SECRET="test-secret" \
		--build-arg NEXTAUTH_URL="http://localhost:3000" \
		-t test-runner . && \
	docker rmi test-runner >/dev/null 2>&1
	@echo "$(GREEN)✓ Tests completed$(NC)"

## test-local: Run tests on host (faster)
.PHONY: test-local
test-local:
	@echo "$(CYAN)🧪 Running tests locally...$(NC)"
	@cd apps/web && pnpm test

#
# ✅ Validation
#

## validate: Run all CI checks locally (same as GitHub Actions)
.PHONY: validate
validate:
	@echo "$(CYAN)🔍 Running CI validation locally...$(NC)"
	@echo "This runs the same checks as GitHub Actions"
	@echo ""
	@docker build --target tester \
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
	@echo "$(CYAN)🗄️  Connecting to database...$(NC)"
	@docker exec -it $$(docker ps -qf "name=postgres") psql -U postgres soccer

## shell: Enter container shell
.PHONY: shell
shell:
	@echo "$(CYAN)🐚 Entering shell...$(NC)"
ifdef s
	@docker exec -it $$(docker ps -qf "name=$(s)") /bin/sh
else
	@docker exec -it $$(docker ps -qf "name=web") /bin/sh
endif

## clean: Clean up resources
.PHONY: clean
clean:
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	@docker compose -f docker-compose.dev.yml down -v
	@docker system prune -f
	@echo "$(GREEN)✓ Cleaned$(NC)"

#
# 🚢 Build & Deploy
#

## build: Build Docker image
.PHONY: build
build:
	@echo "$(CYAN)🔨 Building Docker image...$(NC)"
	@echo "Tag: $(IMAGE_NAME):$(TAG)"
	@docker build -t $(IMAGE_NAME):$(TAG) .
	@echo "$(GREEN)✓ Build complete$(NC)"

## push: Push Docker image
.PHONY: push
push:
	@echo "$(CYAN)📤 Pushing Docker image...$(NC)"
	@docker push $(IMAGE_NAME):$(TAG)
	@echo "$(GREEN)✓ Push complete$(NC)"

## deploy-preview: Deploy to preview environment
.PHONY: deploy-preview
deploy-preview:
ifndef TAG
	@echo "$(RED)❌ Please specify TAG: make deploy-preview TAG=develop-abc123$(NC)"
	@exit 1
endif
	@echo "$(CYAN)🚀 Deploying to preview...$(NC)"
	@echo "Image: $(IMAGE_NAME):$(TAG)"
	@curl -X PUT \
		-H "X-API-Key: $${PORTAINER_API_KEY}" \
		-H "Content-Type: application/json" \
		-d '{"env": [{"name": "IMAGE", "value": "$(IMAGE_NAME):$(TAG)"}]}' \
		$${PORTAINER_HOST}/api/stacks/soccer-preview?endpointId=1
	@echo "$(GREEN)✓ Preview deployment triggered$(NC)"

## deploy-prod: Deploy to production
.PHONY: deploy-prod
deploy-prod:
ifndef TAG
	@echo "$(RED)❌ Please specify TAG: make deploy-prod TAG=v1.2.3$(NC)"
	@exit 1
endif
	@echo "$(RED)$(BOLD)⚠️  PRODUCTION DEPLOYMENT ⚠️$(NC)"
	@echo "Image: $(IMAGE_NAME):$(TAG)"
	@echo -n "Type 'deploy' to confirm: "
	@read confirm && [ "$$confirm" = "deploy" ] || (echo "$(RED)Cancelled$(NC)" && exit 1)
	@echo "$(CYAN)🚀 Deploying to production...$(NC)"
	@curl -X PUT \
		-H "X-API-Key: $${PORTAINER_API_KEY}" \
		-H "Content-Type: application/json" \
		-d '{"env": [{"name": "IMAGE", "value": "$(IMAGE_NAME):$(TAG)"}]}' \
		$${PORTAINER_HOST}/api/stacks/soccer-prod?endpointId=1
	@echo "$(GREEN)✓ Production deployment triggered$(NC)"

#
# 🔧 Advanced (Hidden from main help)
#

## status: Show running containers
.PHONY: status
status:
	@docker compose -f docker-compose.dev.yml ps

## migrate: Run database migrations
.PHONY: migrate
migrate:
	@echo "$(CYAN)🔄 Running migrations...$(NC)"
	@cd apps/web && pnpm db:migrate:deploy

## seed: Seed database
.PHONY: seed  
seed:
	@echo "$(CYAN)🌱 Seeding database...$(NC)"
	@cd apps/web && pnpm db:seed

## typecheck: Run TypeScript type checking
.PHONY: typecheck
typecheck:
	@pnpm typecheck

## lint: Run linter
.PHONY: lint
lint:
	@pnpm lint

## docker-login: Login to GitHub Container Registry
.PHONY: docker-login
docker-login:
	@echo "$(CYAN)🔑 Logging into GitHub Container Registry...$(NC)"
	@echo "You need a GitHub token with 'write:packages' scope"
	@echo -n "GitHub Username: " && read username && \
	echo -n "GitHub Token: " && read -s token && echo && \
	echo $$token | docker login $(REGISTRY) -u $$username --password-stdin