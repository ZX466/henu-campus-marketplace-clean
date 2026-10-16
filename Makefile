# =============================================================================
# CampusCart — Makefile
# Task automation for local development, building, and Git operations
# =============================================================================

.PHONY: help dev build preview install setup backend health db-start db-stop clean git-prep

# Default target
help:
	@echo ================================================================
	@echo CampusCart Developer CLI Commands (Vite + React)
	@echo ================================================================
	@echo   make dev       : Launch Vite HMR dev server (http://localhost:3334)
	@echo   make build     : Build production-ready bundle with Vite
	@echo   make preview   : Preview the production build locally
	@echo   make install   : Install frontend npm dependencies
	@echo   make setup     : Install frontend deps + create backend/.venv
	@echo   make backend   : Start FastAPI backend (http://localhost:8000)
	@echo   make health    : Check frontend / backend / MongoDB
	@echo   make db-start  : Start local MongoDB in Docker (replica set rs0)
	@echo   make git-prep  : Inspect git staging and verify .gitignore status
	@echo   make clean     : Remove temporary cache and log files
	@echo ================================================================

# Start Vite dev server
dev:
	npm --prefix frontend run dev

# Build production bundle
build:
	npm --prefix frontend run build

# Preview production build
preview:
	npm --prefix frontend run preview

# Install dependencies
install:
	npm --prefix frontend install

# Full setup (cross-platform)
setup:
	npm run setup

# Start backend
backend:
	npm run dev:backend

# Health check (frontend 3334 / backend 8000 / MongoDB 27017)
health:
	npm run check:health

# Local MongoDB via Docker
db-start:
	npm run db:start

db-stop:
	npm run db:stop

# Check git status
git-prep:
	git status

# Clean temporary files
clean:
	node -e "for (const d of ['frontend/dist','frontend/node_modules/.vite']) require('fs').rmSync(d,{recursive:true,force:true})"
	@echo Clean complete.
