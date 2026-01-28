# musicproj

super cool no troll app

# ============================================

# RUN COMMANDS

# ============================================

# From root directory:

- Remember to run docker compose down --> docker compose up -d --build during code changes.

# npm run dev # Run both frontend and backend

# npm run dev:backend # Run only backend

# npm run dev:frontend # Run only frontend

# npm run build # Build both for production

# ============================================

# DOCKER COMMANDS REFERENCE

# ============================================

# --- DEVELOPMENT ---

# Start all services (databases only)

docker-compose up postgres neo4j redis -d

# Start everything including app

docker-compose up -d

# Start with live reload (development)

docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View logs

docker-compose logs -f # All services
docker-compose logs -f backend # Just backend

# Rebuild after code changes

docker-compose up -d --build

# Shutting down everything

docker-compose down

# --- DATABASE ACCESS ---

# PostgreSQL shell

docker exec -it app_postgres psql -U postgres -d myapp

# Redis CLI

docker exec -it app_redis redis-cli

# Neo4j (access via browser: http://localhost:7474)

# --- CLEANUP ---

# Stop all containers

docker-compose down

# Stop and remove volumes (DELETES ALL DATA)

docker-compose down -v

# Remove unused images

docker image prune -a

# --- PRODUCTION ---

# Build production images

docker-compose build

# Start in production mode

docker-compose -f docker-compose.yml up -d

# --- USEFUL COMMANDS ---

# Check container status

docker-compose ps

# Restart a specific service

docker-compose restart backend

# Execute command in running container

docker exec -it app_backend sh

# View container resource usage

docker stats

# ============================================

# QUICK START

# ============================================

# 1. Copy environment file

cp .env.example .env

# 2. Start databases

docker-compose up postgres neo4j redis -d

# 3. Wait for healthy status

docker-compose ps

# 4. Run backend locally (for development)

cd backend && npm run dev

# 5. Run frontend locally (for development)

cd frontend && npm run dev

# OR run everything in Docker:

docker-compose up -d

# ============================================

# DB VISUALIZAITION SETUP

# ============================================

## pgAdmin — Connect to PostgreSQL

Open http://localhost:5050
Right-click Servers → Register → Server
General tab: Name it Local
Connection tab:

Host: postgres (Docker network name, not localhost)
Port: 5432
Username: postgres
Password: postgres

Click Save

## Redis Insight — Connect to Redis

Open http://localhost:5540
Click Add Redis Database
Enter:

Host: host.docker.internal (or redis if on Linux)
Port: 6379

Click Add Database
