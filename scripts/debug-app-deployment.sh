#!/bin/bash

echo "=== App Container Debug Script ==="
echo ""

# Function to check Docker service
check_service() {
    local service_name=$1
    echo "=== Checking $service_name service ==="
    
    # Get service info
    docker service ps $service_name --no-trunc 2>&1 | head -5
    
    # Get recent logs
    echo ""
    echo "Recent logs:"
    docker service logs $service_name --tail 20 2>&1
    echo ""
}

# Check app service
check_service "soccer-preview_app"

# Check if app_db_password secret exists
echo "=== Checking app_db_password secret ==="
docker secret ls | grep app_db_password || echo "❌ app_db_password secret not found!"

# Test database connectivity from host
echo ""
echo "=== Testing database connectivity ==="
echo "Enter the appuser password (from app_db_password secret):"
read -s APP_PASSWORD

echo ""
echo "Testing connection to soccer database as appuser..."
PGPASSWORD="$APP_PASSWORD" psql -h 172.20.0.22 -p 5435 -U appuser -d soccer -c "SELECT current_database(), current_user, version();" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo ""
    echo "Possible issues:"
    echo "1. app_db_password secret not created in Portainer"
    echo "2. appuser not created in database"
    echo "3. Password mismatch between secret and database user"
fi

# Check networking between containers
echo ""
echo "=== Checking container networking ==="
echo "Getting app container ID..."
APP_CONTAINER=$(docker ps --filter "label=com.docker.swarm.service.name=soccer-preview_app" --format "{{.ID}}" | head -1)

if [ -n "$APP_CONTAINER" ]; then
    echo "App container: $APP_CONTAINER"
    echo "Testing postgres connectivity from app container..."
    docker exec $APP_CONTAINER sh -c "nc -zv postgres 5432" 2>&1 || echo "Cannot test connectivity (nc not available)"
else
    echo "❌ App container not found or not running"
fi

# Check postgres service
echo ""
check_service "soccer-preview_postgres"

# Check if init script ran
echo ""
echo "=== Checking if database initialization ran ==="
echo "Looking for appuser in postgres..."
echo "Enter the postgres superuser password:"
read -s POSTGRES_PASSWORD

echo ""
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 172.20.0.22 -p 5435 -U postgres -d postgres -c "SELECT usename, datname FROM pg_user JOIN pg_database ON true WHERE usename IN ('appuser', 'n8nuser') AND datname IN ('soccer', 'n8n');" 2>&1