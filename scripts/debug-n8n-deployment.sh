#!/bin/bash

echo "=== n8n Deployment Debug Script ==="
echo ""

# Check if N8N_DB_PASSWORD is set
if [ -z "${N8N_DB_PASSWORD}" ]; then
    echo "❌ ERROR: N8N_DB_PASSWORD environment variable is not set!"
    echo ""
    echo "To fix this issue:"
    echo "1. In Portainer, go to Stacks > soccer-preview"
    echo "2. Click 'Edit this stack'"
    echo "3. In the 'Environment variables' section, add:"
    echo "   Name: N8N_DB_PASSWORD"
    echo "   Value: [your secure password]"
    echo "4. Click 'Update the stack'"
    echo ""
    echo "Example password: $(openssl rand -base64 16)"
else
    echo "✅ N8N_DB_PASSWORD is set"
    echo "   Length: ${#N8N_DB_PASSWORD} characters"
fi

echo ""
echo "=== Checking n8n service status ==="
docker service ps soccer-preview_n8n --no-trunc

echo ""
echo "=== Testing database connection ==="
echo "Attempting to connect as n8nuser..."

# Test connection with the password
if [ -n "${N8N_DB_PASSWORD}" ]; then
    PGPASSWORD="${N8N_DB_PASSWORD}" psql -h 172.20.0.22 -p 5435 -U n8nuser -d n8n -c "SELECT 1;" 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        echo "   Check that n8nuser exists and password matches"
    fi
else
    echo "⚠️  Cannot test connection - N8N_DB_PASSWORD not set"
fi

echo ""
echo "=== n8n volume permissions ==="
ls -la /mnt/truenas/docker_volumes/project-unity/preview/n8n/ 2>/dev/null || echo "Cannot access volume directory from this host"

echo ""
echo "=== Recent n8n logs ==="
docker service logs soccer-preview_n8n --tail 20 2>&1 || echo "Cannot retrieve logs"