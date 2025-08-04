# Project Unify - Developer Experience Makefile
# ============================================
# Design Principles:
# - Intuitive: Commands are what you'd naturally type
# - Helpful: Always show next steps and current state
# - Safe: Confirmations for destructive operations
# - Fast: Common tasks are short to type
# - Delightful: Clear feedback and friendly messages

# Default shell
SHELL := /bin/bash

# Colors for beautiful output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color
BOLD := \033[1m

# Project info
PROJECT_NAME := Soccer Project Unify
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)

# Docker registry settings
REGISTRY := ghcr.io
GITHUB_USER := joshshaloo
GITHUB_REPO := soccer/project-unify
IMAGE_NAME := $(REGISTRY)/$(GITHUB_USER)/$(GITHUB_REPO)
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
GIT_SHA := $(shell git rev-parse --short HEAD)

# Image tags based on branch
ifeq ($(GIT_BRANCH),main)
	IMAGE_TAG := latest
else ifeq ($(GIT_BRANCH),develop)
	IMAGE_TAG := develop
else
	# For feature branches and PRs - replace slashes with dashes
	SAFE_BRANCH := $(shell echo $(GIT_BRANCH) | sed 's/\//-/g')
	IMAGE_TAG := $(SAFE_BRANCH)-$(GIT_SHA)
endif

# Environment detection
ENV ?= dev
ifeq ($(ENV),prod)
	STACK_FILE := docker-stack.prod.yml
	ENV_NAME := Production
	URL := https://soccer-unify.com
else ifeq ($(ENV),preview)
	STACK_FILE := docker-stack.preview.yml
	ENV_NAME := Preview
	URL := https://preview.soccer-unify.com
else
	STACK_FILE := docker-compose.dev.yml
	ENV_NAME := Development
	URL := http://localhost:3001
endif

# Default target - show help
.DEFAULT_GOAL := help

#
# 🚀 Quick Start Commands
#

## help: Show this beautiful help message
.PHONY: help
help:
	@echo ""
	@echo "$(BOLD)$(CYAN)⚽ $(PROJECT_NAME) - Developer Commands$(NC)"
	@echo "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(BOLD)🚀 Quick Start$(NC)"
	@echo "  $(GREEN)make start$(NC)          - Start everything (auto-detects environment)"
	@echo "  $(GREEN)make stop$(NC)           - Stop everything gracefully"
	@echo "  $(GREEN)make restart$(NC)        - Restart everything"
	@echo "  $(GREEN)make status$(NC)         - Show what's running"
	@echo ""
	@echo "$(BOLD)💻 Development$(NC)"
	@echo "  $(GREEN)make dev$(NC)            - Start everything + Next.js dev server"
	@echo "  $(GREEN)make stop-web$(NC)       - Stop just the Next.js dev server"
	@echo "  $(GREEN)make logs$(NC)           - Show logs (use s=service for specific)"
	@echo "  $(GREEN)make shell$(NC)          - Enter app container (use s=service)"
	@echo "  $(GREEN)make db$(NC)             - Connect to database"
	@echo "  $(GREEN)make test$(NC)           - Run all tests"
	@echo "  $(GREEN)make test-unit$(NC)      - Run unit tests only"
	@echo "  $(GREEN)make test-e2e$(NC)       - Run E2E tests only"
	@echo ""
	@echo "$(BOLD)🏗️  Build & Deploy$(NC)"
	@echo "  $(GREEN)make build$(NC)          - Build Docker image"
	@echo "  $(GREEN)make push$(NC)           - Push image to GitHub registry"
	@echo "  $(GREEN)make docker-login$(NC)   - Login to GitHub Container Registry"
	@echo "  $(GREEN)make deploy$(NC)         - Deploy to current ENV (dev/preview/prod)"
	@echo "  $(GREEN)make deploy-pr$(NC)      - Deploy PR preview (use PR=123)"
	@echo "  $(GREEN)make preview$(NC)        - Deploy to preview environment"
	@echo "  $(GREEN)make prod$(NC)           - Deploy to production (with confirmation)"
	@echo ""
	@echo "$(BOLD)🗄️  Database$(NC)"
	@echo "  $(GREEN)make migrate$(NC)        - Run database migrations"
	@echo "  $(GREEN)make seed$(NC)           - Seed database with test data"
	@echo "  $(GREEN)make db-reset$(NC)       - Reset database (with confirmation)"
	@echo "  $(GREEN)make backup$(NC)         - Backup database"
	@echo "  $(GREEN)make restore$(NC)        - Restore database from backup"
	@echo ""
	@echo "$(BOLD)🧹 Maintenance$(NC)"
	@echo "  $(GREEN)make clean$(NC)          - Clean up containers and volumes"
	@echo "  $(GREEN)make update$(NC)         - Update all dependencies"
	@echo "  $(GREEN)make health$(NC)         - Health check all services"
	@echo ""
	@echo "$(YELLOW)Current Environment: $(BOLD)$(ENV_NAME)$(NC) (ENV=$(ENV))"
	@echo "$(YELLOW)URL: $(BOLD)$(URL)$(NC)"
	@echo ""

## start: Start everything
.PHONY: start
start:
	@echo "$(CYAN)🚀 Starting $(ENV_NAME) environment...$(NC)"
ifeq ($(ENV),dev)
	@docker compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✓ Services started!$(NC)"
	@echo ""
	@echo "$(YELLOW)📝 Next steps:$(NC)"
	@echo "  1. Run $(BOLD)make logs$(NC) to see service logs"
	@echo "  2. Run $(BOLD)make dev$(NC) to start everything in Docker"
	@echo "  3. Application will be available at $(BOLD)http://localhost:3001$(NC)"
	@echo ""
	@echo "$(CYAN)📧 MailHog UI: http://localhost:8025$(NC)"
	@echo "$(CYAN)🔄 n8n UI: http://localhost:5678$(NC)"
else
	@docker stack deploy -c $(STACK_FILE) project-unify-$(ENV)
	@echo "$(GREEN)✓ Stack deployed to $(ENV_NAME)!$(NC)"
	@echo "$(YELLOW)Check status with: make status$(NC)"
endif

## stop: Stop everything gracefully
.PHONY: stop
stop:
	@echo "$(YELLOW)🛑 Stopping $(ENV_NAME) environment...$(NC)"
	@# Kill any running Next.js dev servers
	@pkill -f "next dev" 2>/dev/null || true
ifeq ($(ENV),dev)
	@docker compose -f docker-compose.dev.yml down
else
	@docker stack rm project-unify-$(ENV)
endif
	@echo "$(GREEN)✓ Stopped successfully$(NC)"

## stop-web: Stop just the Next.js dev server
.PHONY: stop-web
stop-web:
	@echo "$(YELLOW)🛑 Stopping Next.js dev server...$(NC)"
	@pkill -f "next dev" 2>/dev/null || echo "$(YELLOW)No Next.js dev server running$(NC)"
	@echo "$(GREEN)✓ Web server stopped$(NC)"

## restart: Restart everything
.PHONY: restart
restart:
	@$(MAKE) stop
	@sleep 2
	@$(MAKE) start

## status: Show what's running
.PHONY: status
status:
	@echo "$(CYAN)📊 $(ENV_NAME) Environment Status$(NC)"
	@echo "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
ifeq ($(ENV),dev)
	@docker compose -f docker-compose.dev.yml ps
else
	@docker stack ps project-unify-$(ENV) --format "table {{.Name}}\t{{.Image}}\t{{.CurrentState}}\t{{.Ports}}"
endif
	@echo ""
	@echo "$(GREEN)URL: $(BOLD)$(URL)$(NC)"

#
# 💻 Development Commands
#

## dev: Start development environment
.PHONY: dev
dev: ENV=dev
dev:
	@echo "$(CYAN)🚀 Starting development environment...$(NC)"
	@# Kill any existing Next.js dev servers running outside Docker
	@pkill -f "next dev" 2>/dev/null || true
	@# Build and start all services including web app
	@docker compose -f docker-compose.dev.yml up -d --build
	@echo "$(GREEN)✓ All services started in Docker!$(NC)"
	@echo ""
	@echo "$(CYAN)🌐 Application: http://localhost:3001$(NC)"
	@echo "$(CYAN)📧 MailHog UI: http://localhost:8025$(NC)"
	@echo "$(CYAN)🔄 n8n UI: http://localhost:5678$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Hot reload is enabled - edit files and see changes instantly!$(NC)"
	@echo "$(YELLOW)📋 View logs: make logs s=web$(NC)"

## logs: Show logs (use s=service to filter)
.PHONY: logs
logs:
ifdef s
	@echo "$(CYAN)📋 Logs for $(s)...$(NC)"
ifeq ($(ENV),dev)
	@docker compose -f docker-compose.dev.yml logs -f $(s)
else
	@docker service logs -f project-unify-$(ENV)_$(s)
endif
else
	@echo "$(CYAN)📋 All logs...$(NC)"
ifeq ($(ENV),dev)
	@docker compose -f docker-compose.dev.yml logs -f
else
	@docker service logs -f project-unify-$(ENV)_app
endif
endif

## shell: Enter container shell (use s=service)
.PHONY: shell
shell:
	@echo "$(CYAN)🐚 Entering shell...$(NC)"
ifdef s
	@docker exec -it $$(docker ps -qf "name=$(s)") /bin/sh
else
ifeq ($(ENV),dev)
	@docker exec -it $$(docker ps -qf "name=postgres") /bin/bash
else
	@docker exec -it $$(docker ps -qf "name=project-unify-$(ENV)_app") /bin/sh
endif
endif

## db: Connect to database
.PHONY: db
db:
	@echo "$(CYAN)🗄️  Connecting to $(ENV_NAME) database...$(NC)"
	@docker exec -it $$(docker ps -qf "name=postgres") psql -U postgres soccer

## test: Run all tests
.PHONY: test
test:
	@echo "$(CYAN)🧪 Running all tests...$(NC)"
	@cd apps/web && pnpm test && pnpm test:e2e

## test-unit: Run unit tests only
.PHONY: test-unit
test-unit:
	@echo "$(CYAN)🧪 Running unit tests...$(NC)"
	@cd apps/web && pnpm test

## test-e2e: Run E2E tests only
.PHONY: test-e2e
test-e2e:
	@echo "$(CYAN)🧪 Running E2E tests...$(NC)"
	@cd apps/web && pnpm test:e2e

## test-watch: Run tests in watch mode
.PHONY: test-watch
test-watch:
	@echo "$(CYAN)🧪 Running tests in watch mode...$(NC)"
	@cd apps/web && pnpm vitest --watch

#
# 🏗️ Build & Deploy Commands
#

## docker-login: Login to GitHub Container Registry
.PHONY: docker-login
docker-login:
	@echo "$(CYAN)🔑 Logging into GitHub Container Registry...$(NC)"
	@echo "$(YELLOW)You'll need a GitHub Personal Access Token with 'write:packages' scope$(NC)"
	@echo -n "GitHub Username: " && read username && \
	echo -n "GitHub Token: " && read -s token && echo && \
	echo $$token | docker login $(REGISTRY) -u $$username --password-stdin
	@echo "$(GREEN)✓ Login successful!$(NC)"

## build: Build Docker image
.PHONY: build
build:
	@echo "$(CYAN)🔨 Building Docker image...$(NC)"
	@echo "Image: $(IMAGE_NAME):$(IMAGE_TAG)"
	@docker build -t $(IMAGE_NAME):$(IMAGE_TAG) -t $(IMAGE_NAME):$(GIT_SHA) .
	@echo "$(GREEN)✓ Build complete!$(NC)"
	@echo "Tagged as:"
	@echo "  - $(IMAGE_NAME):$(IMAGE_TAG)"
	@echo "  - $(IMAGE_NAME):$(GIT_SHA)"

## push: Push image to GitHub Container Registry
.PHONY: push
push:
	@echo "$(CYAN)📤 Pushing to GitHub Container Registry...$(NC)"
	@docker push $(IMAGE_NAME):$(IMAGE_TAG)
	@docker push $(IMAGE_NAME):$(GIT_SHA)
	@echo "$(GREEN)✓ Push complete!$(NC)"

## build-push: Build and push in one command
.PHONY: build-push
build-push: build push

## deploy: Deploy to current environment via Portainer
.PHONY: deploy
deploy:
	@echo "$(CYAN)🚀 Deploying to $(ENV_NAME)...$(NC)"
ifeq ($(ENV),prod)
	@$(MAKE) deploy-prod
else ifeq ($(ENV),preview)
	@$(MAKE) deploy-preview
else
	@echo "$(RED)❌ Cannot deploy to development. Use 'make start' instead.$(NC)"
endif

## deploy-preview: Deploy to preview environment via Portainer
.PHONY: deploy-preview
deploy-preview:
	@echo "$(CYAN)🔍 Deploying to Preview via Portainer...$(NC)"
	@echo "$(YELLOW)Connecting via Tailscale...$(NC)"
	@curl -X POST \
		-H "X-API-Key: $${PORTAINER_API_KEY}" \
		-H "Content-Type: application/json" \
		-d '{"image": "$(IMAGE_NAME):develop", "env": "preview"}' \
		https://portainer.homelab.internal:9443/api/stacks/soccer-preview/git/deploy
	@echo "$(GREEN)✓ Preview deployment triggered!$(NC)"
	@echo "$(YELLOW)URL: https://preview.soccer-unify.com$(NC)"

## deploy-prod: Deploy to production via Portainer
.PHONY: deploy-prod
deploy-prod:
	@echo "$(RED)$(BOLD)⚠️  PRODUCTION DEPLOYMENT ⚠️$(NC)"
	@echo "$(YELLOW)This will deploy to the live production environment.$(NC)"
	@echo -n "$(BOLD)Are you sure? Type 'deploy-to-prod' to confirm: $(NC)"
	@read confirm && [ "$$confirm" = "deploy-to-prod" ] || (echo "$(RED)Cancelled$(NC)" && exit 1)
	@echo "$(CYAN)🚀 Deploying to Production via Portainer...$(NC)"
	@curl -X POST \
		-H "X-API-Key: $${PORTAINER_API_KEY}" \
		-H "Content-Type: application/json" \
		-d '{"image": "$(IMAGE_NAME):latest", "env": "production"}' \
		https://portainer.homelab.internal:9443/api/stacks/soccer-prod/git/deploy
	@echo "$(GREEN)✓ Production deployment triggered!$(NC)"
	@echo "$(YELLOW)URL: https://soccer-unify.com$(NC)"

## deploy-pr: Deploy PR preview
.PHONY: deploy-pr
deploy-pr:
ifndef PR
	@echo "$(RED)❌ Please specify PR number: make deploy-pr PR=123$(NC)"
	@exit 1
endif
	@echo "$(CYAN)🔍 Deploying PR #$(PR) preview...$(NC)"
	@echo "Building PR image..."
	@docker build -t $(IMAGE_NAME):pr-$(PR) .
	@echo "Pushing PR image..."
	@docker push $(IMAGE_NAME):pr-$(PR)
	@echo "Deploying to Portainer..."
	@curl -X POST \
		-H "X-API-Key: $${PORTAINER_API_KEY}" \
		-H "Content-Type: application/json" \
		-d '{ \
			"name": "soccer-pr-$(PR)", \
			"type": 2, \
			"method": "string", \
			"stackFileContent": "version: \"3.9\"\nservices:\n  web:\n    image: $(IMAGE_NAME):pr-$(PR)\n    environment:\n      - NODE_ENV=preview\n      - DATABASE_URL=$${DATABASE_URL_PREVIEW}\n      - NEXT_PUBLIC_APP_URL=https://pr-$(PR).soccer-unify.homelab.internal\n      - OPENAI_API_KEY=$${OPENAI_API_KEY}\n      - N8N_WEBHOOK_URL=$${N8N_WEBHOOK_URL}\n      - PORT=3000\n    labels:\n      - traefik.enable=true\n      - traefik.http.routers.pr-$(PR).rule=Host(\`pr-$(PR).soccer-unify.homelab.internal\`)\n      - traefik.http.routers.pr-$(PR).tls=true\n      - traefik.http.services.pr-$(PR).loadbalancer.server.port=3000\n      - com.soccer.pr=$(PR)\n      - com.soccer.type=preview\n    networks:\n      - traefik\n    deploy:\n      replicas: 1\n      update_config:\n        parallelism: 1\n        delay: 10s\n      restart_policy:\n        condition: on-failure\n        delay: 5s\n        max_attempts: 3\nnetworks:\n  traefik:\n    external: true" \
		}' \
		https://portainer.homelab.internal:9443/api/stacks?type=2&endpointId=1
	@echo "$(GREEN)✓ PR #$(PR) deployed!$(NC)"
	@echo "$(YELLOW)URL: https://pr-$(PR).soccer-unify.homelab.internal$(NC)"

## cleanup-pr: Cleanup PR preview deployment
.PHONY: cleanup-pr
cleanup-pr:
ifndef PR
	@echo "$(RED)❌ Please specify PR number: make cleanup-pr PR=123$(NC)"
	@exit 1
endif
	@echo "$(YELLOW)🧹 Cleaning up PR #$(PR) preview...$(NC)"
	@curl -X DELETE \
		-H "X-API-Key: $${PORTAINER_API_KEY}" \
		https://portainer.homelab.internal:9443/api/stacks/soccer-pr-$(PR)
	@echo "$(GREEN)✓ PR #$(PR) preview cleaned up!$(NC)"

## preview: Deploy to preview environment  
.PHONY: preview
preview: ENV=preview
preview: deploy-preview

## prod: Deploy to production
.PHONY: prod
prod: ENV=prod
prod: deploy-prod

#
# 🗄️ Database Commands
#

## migrate: Run database migrations
.PHONY: migrate
migrate:
	@echo "$(CYAN)🔄 Running migrations...$(NC)"
	@cd apps/web && pnpm db:migrate:deploy

## seed: Seed database with test data
.PHONY: seed
seed:
	@echo "$(CYAN)🌱 Seeding database...$(NC)"
	@cd apps/web && pnpm db:seed

## db-reset: Reset database (with confirmation)
.PHONY: db-reset
db-reset:
	@echo "$(RED)$(BOLD)⚠️  DATABASE RESET ⚠️$(NC)"
	@echo "$(YELLOW)This will delete all data in the $(ENV_NAME) database.$(NC)"
	@echo -n "$(BOLD)Are you sure? Type 'reset-database' to confirm: $(NC)"
	@read confirm && [ "$$confirm" = "reset-database" ] || (echo "$(RED)Cancelled$(NC)" && exit 1)
	@cd apps/web && pnpm db:reset
	@echo "$(GREEN)✓ Database reset complete$(NC)"

## backup: Backup database
.PHONY: backup
backup:
	@echo "$(CYAN)💾 Backing up $(ENV_NAME) database...$(NC)"
ifeq ($(ENV),dev)
	@mkdir -p backups
	@docker exec $$(docker ps -qf "name=postgres") pg_dump -U postgres soccer | gzip > backups/soccer_dev_$(TIMESTAMP).sql.gz
else ifeq ($(ENV),preview)
	@docker exec $$(docker ps -qf "name=postgres" -f "label=com.docker.swarm.service.name=project-unify-preview_postgres") pg_dump -U postgres soccer | gzip > /mnt/truenas/docker_volumes/project-unity/preview/backups/soccer_$(TIMESTAMP).sql.gz
else
	@docker exec $$(docker ps -qf "name=postgres" -f "label=com.docker.swarm.service.name=project-unify-prod_postgres") pg_dump -U postgres soccer | gzip > /mnt/truenas/docker_volumes/project-unity/prod/backups/soccer_$(TIMESTAMP).sql.gz
endif
	@echo "$(GREEN)✓ Backup saved: soccer_$(ENV)_$(TIMESTAMP).sql.gz$(NC)"

## restore: Restore database from backup
.PHONY: restore
restore:
	@echo "$(CYAN)📥 Available backups:$(NC)"
ifeq ($(ENV),dev)
	@ls -la backups/*.sql.gz 2>/dev/null || echo "No backups found"
else ifeq ($(ENV),preview)
	@ls -la /mnt/truenas/docker_volumes/project-unity/preview/backups/*.sql.gz 2>/dev/null || echo "No backups found"
else
	@ls -la /mnt/truenas/docker_volumes/project-unity/prod/backups/*.sql.gz 2>/dev/null || echo "No backups found"
endif
	@echo ""
	@echo -n "$(BOLD)Enter backup filename to restore: $(NC)"
	@read backup; \
	if [ -n "$$backup" ]; then \
		echo "$(YELLOW)Restoring from $$backup...$(NC)"; \
		gunzip < $$backup | docker exec -i $$(docker ps -qf "name=postgres") psql -U postgres soccer; \
		echo "$(GREEN)✓ Restore complete$(NC)"; \
	else \
		echo "$(RED)No backup specified$(NC)"; \
	fi

#
# 🧹 Maintenance Commands
#

## clean: Clean up containers and volumes
.PHONY: clean
clean:
	@echo "$(YELLOW)🧹 Cleaning up...$(NC)"
	@docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

## update: Update all dependencies
.PHONY: update
update:
	@echo "$(CYAN)📦 Updating dependencies...$(NC)"
	@cd apps/web && pnpm update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

## health: Health check all services
.PHONY: health
health:
	@echo "$(CYAN)🏥 Health Check for $(ENV_NAME)$(NC)"
	@echo "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo -n "PostgreSQL: "
	@docker exec $$(docker ps -qf "name=postgres") pg_isready -U postgres >/dev/null 2>&1 && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo -n "Redis: "
	@docker exec $$(docker ps -qf "name=redis") redis-cli ping >/dev/null 2>&1 && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
ifeq ($(ENV),dev)
	@echo -n "MailHog: "
	@curl -s http://localhost:8025/api/v2/messages >/dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo -n "n8n: "
	@curl -s http://localhost:5678/healthz >/dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
endif
	@echo -n "App: "
	@curl -s $(URL) >/dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(YELLOW)⚡ Not running (run 'make start')$(NC)"

#
# 🎯 Convenience Shortcuts
#

## up: Alias for start
.PHONY: up
up: start

## down: Alias for stop
.PHONY: down
down: stop

## ps: Alias for status
.PHONY: ps
ps: status

## l: Alias for logs
.PHONY: l
l: logs

#
# 🛠️ Advanced Commands (hidden from help)
#

## docker-clean: Deep clean Docker system
.PHONY: docker-clean
docker-clean:
	@echo "$(RED)$(BOLD)⚠️  DOCKER DEEP CLEAN ⚠️$(NC)"
	@echo "$(YELLOW)This will remove all stopped containers, unused images, and volumes.$(NC)"
	@echo -n "$(BOLD)Continue? [y/N]: $(NC)"
	@read confirm && [ "$$confirm" = "y" ] || (echo "$(RED)Cancelled$(NC)" && exit 1)
	docker system prune -af --volumes

## env-switch: Switch between environments
.PHONY: env-switch
env-switch:
	@echo "$(CYAN)🔄 Switch Environment$(NC)"
	@echo "Current: $(BOLD)$(ENV_NAME)$(NC)"
	@echo ""
	@echo "1) Development (dev)"
	@echo "2) Preview (preview)"
	@echo "3) Production (prod)"
	@echo ""
	@echo -n "Select environment [1-3]: "
	@read choice; \
	case $$choice in \
		1) echo "export ENV=dev" > .env.make; echo "$(GREEN)✓ Switched to Development$(NC)";; \
		2) echo "export ENV=preview" > .env.make; echo "$(GREEN)✓ Switched to Preview$(NC)";; \
		3) echo "export ENV=prod" > .env.make; echo "$(GREEN)✓ Switched to Production$(NC)";; \
		*) echo "$(RED)Invalid choice$(NC)";; \
	esac

# Include local environment if exists
-include .env.make