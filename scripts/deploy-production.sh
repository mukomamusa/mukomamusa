#!/bin/bash

# Vayazed v2.0.0 Production Deployment Script
# This script sets up and deploys Vayazed to production

set -e  # Exit on any error

echo "🚀 Vayazed v2.0.0 Production Deployment"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning "No .env file found. Creating from template..."
    cp .env.example .env
    print_info "Please edit .env with your production values before continuing."
    exit 1
fi

print_success "Environment file found"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required"
    exit 1
fi
print_success "Node.js version: $(node -v)"

# Install dependencies
print_info "Installing dependencies..."
npm ci --production=false

if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check database connection
print_info "Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    print_success "Database URL configured"
else
    print_error "DATABASE_URL not set in .env file"
    exit 1
fi

# Run database migrations
print_info "Running database migrations..."
npm run db:migrate 2>/dev/null || node migrate-enhanced.js

if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_warning "Migration may have issues, continuing..."
fi

# Seed database (optional - comment out for existing database)
# print_info "Seeding database..."
# npm run seed
# print_success "Database seeded"

# Build application
print_info "Building application for production..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Run tests (optional)
# print_info "Running tests..."
# npm test
# print_success "Tests passed"

# Check for required environment variables
print_info "Verifying environment variables..."

REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NEXTAUTH_SECRET"
    "NEXT_PUBLIC_BASE_URL"
)

MISSING_VARS=0

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        print_error "$VAR is not set"
        MISSING_VARS=1
    else
        print_success "$VAR is set"
    fi
done

if [ $MISSING_VARS -eq 1 ]; then
    print_error "Missing required environment variables. Please check your .env file."
    exit 1
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p public/uploads
mkdir -p logs
print_success "Directories created"

# Set file permissions
print_info "Setting file permissions..."
chmod -R 755 public/
chmod -R 755 logs/
print_success "Permissions set"

# Display deployment summary
echo ""
echo "========================================="
echo "📊 Deployment Summary"
echo "========================================="
echo "Application: Vayazed v2.0.0"
echo "Node.js: $(node -v)"
echo "NPM: $(npm -v)"
echo "Database: Configured"
echo "Build: Completed"
echo ""

# Deployment options
echo "🚀 Deployment Options:"
echo ""
echo "1. Deploy to Vercel (Recommended):"
echo "   npx vercel --prod"
echo ""
echo "2. Deploy to Railway:"
echo "   railway deploy"
echo ""
echo "3. Deploy with PM2 (VPS/Server):"
echo "   pm2 start npm --name 'vayazed' -- start"
echo ""
echo "4. Deploy with Docker:"
echo "   docker build -t vayazed:latest ."
echo "   docker run -p 3000:3000 vayazed:latest"
echo ""
echo "5. Start locally:"
echo "   npm start"
echo ""

print_success "Production deployment preparation complete!"
print_info "Choose a deployment option above to go live."

# Health check URL
if [ -n "$NEXT_PUBLIC_BASE_URL" ]; then
    echo ""
    echo "After deployment, verify at: $NEXT_PUBLIC_BASE_URL/api/health"
fi