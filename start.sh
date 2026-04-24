#!/bin/bash

# ============================================
# RV Park & Campground Manager - Start Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     🏕️  RV Park & Campground Manager  🏕️        ║"
echo "║            Starting Application...               ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found! Please create one.${NC}"
    exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-4001}
FRONTEND_PORT=${FRONTEND_PORT:-3001}

# ============================================
# Step 1: Clean up used ports
# ============================================
echo -e "\n${YELLOW}[1/6] Cleaning up ports...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "  ${CYAN}Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        echo -e "  ${GREEN}Port $port is free${NC}"
    fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

echo -e "${GREEN}✓ Ports cleaned${NC}"

# ============================================
# Step 2: Check PostgreSQL
# ============================================
echo -e "\n${YELLOW}[2/6] Checking PostgreSQL...${NC}"

if command -v pg_isready &> /dev/null; then
    if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${RED}✗ PostgreSQL is not running. Please start it first.${NC}"
        echo -e "${CYAN}  macOS: brew services start postgresql${NC}"
        echo -e "${CYAN}  Linux: sudo systemctl start postgresql${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ============================================
# Step 3: Create database if not exists
# ============================================
echo -e "\n${YELLOW}[3/6] Setting up database...${NC}"

DB_NAME=${DB_NAME:-rv_park_manager}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Create database if it doesn't exist
if PGPASSWORD=${DB_PASSWORD:-postgres} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "  ${GREEN}Database '$DB_NAME' already exists${NC}"
else
    echo -e "  ${CYAN}Creating database '$DB_NAME'...${NC}"
    PGPASSWORD=${DB_PASSWORD:-postgres} createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || \
    PGPASSWORD=${DB_PASSWORD:-postgres} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || \
    echo -e "  ${YELLOW}⚠ Could not create database. It may already exist or you may need to create it manually.${NC}"
fi

echo -e "${GREEN}✓ Database ready${NC}"

# ============================================
# Step 4: Install dependencies
# ============================================
echo -e "\n${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${CYAN}Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"

echo -e "  ${CYAN}Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"

cd "$PROJECT_DIR"

# ============================================
# Step 5: Seed database
# ============================================
echo -e "\n${YELLOW}[5/6] Seeding database...${NC}"

cd "$BACKEND_DIR"
node seeds/seed.js
echo -e "${GREEN}✓ Database seeded successfully${NC}"

cd "$PROJECT_DIR"

# ============================================
# Step 6: Start servers with hot reload
# ============================================
echo -e "\n${YELLOW}[6/6] Starting servers...${NC}"

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    cleanup_port $BACKEND_PORT
    cleanup_port $FRONTEND_PORT
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with --watch for hot reload
echo -e "  ${CYAN}Starting backend on port $BACKEND_PORT (with hot reload)...${NC}"
cd "$BACKEND_DIR"
node --watch server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend with Vite (has built-in HMR)
echo -e "  ${CYAN}Starting frontend on port $FRONTEND_PORT (with HMR)...${NC}"
cd "$FRONTEND_DIR"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!

cd "$PROJECT_DIR"

sleep 2

echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║           🎉 Application Started! 🎉             ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  Frontend:  http://localhost:$FRONTEND_PORT            ║"
echo "║  Backend:   http://localhost:$BACKEND_PORT            ║"
echo "║                                                  ║"
echo "║  Login:     admin@rvpark.com / admin123          ║"
echo "║                                                  ║"
echo "║  Press Ctrl+C to stop all services               ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Wait for background processes
wait
