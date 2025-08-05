# n8n Verification Checklist

This checklist helps verify that n8n is running properly after deployment.

## Pre-deployment Steps

1. **Set Environment Variable in Portainer**
   - When deploying the stack, set `N8N_DB_PASSWORD` environment variable
   - This should match the password you want for the n8nuser database user

2. **Ensure Volumes Exist**
   - Directory: `/mnt/truenas/docker_volumes/project-unity/preview/n8n`
   - Owner should be UID 1000 (user: "1000:1000" in docker-stack)

## Post-deployment Verification

### 1. Check Service Status
```bash
# Check if n8n service is running
docker service ls | grep n8n

# Check n8n service details
docker service ps soccer-preview_n8n
```

### 2. Check Container Logs
```bash
# View n8n logs
docker service logs soccer-preview_n8n --tail 50

# Follow logs in real-time
docker service logs -f soccer-preview_n8n
```

### 3. Test n8n Web Interface
- URL: https://preview-n8n.clubomatic.ai/
- Should see n8n login or setup page
- No authentication errors should appear

### 4. Test Database Connection
```bash
# Connect to postgres and verify n8n database
psql -h 172.20.0.22 -p 5435 -U n8nuser n8n

# Check if tables exist (after first n8n startup)
\dt
```

### 5. Check Health Status
```bash
# Check container health
docker ps --filter "name=n8n" --format "table {{.Names}}\t{{.Status}}"
```

### 6. Test Webhook URL
```bash
# Test if n8n is accessible
curl -I https://preview-n8n.clubomatic.ai/
```

## Common Issues and Solutions

### Issue: n8n container keeps restarting
**Solution**: Check logs for database connection errors. Ensure N8N_DB_PASSWORD is set correctly.

### Issue: Permission denied errors
**Solution**: Ensure n8n volume directory is owned by UID 1000:
```bash
sudo chown -R 1000:1000 /mnt/truenas/docker_volumes/project-unity/preview/n8n
```

### Issue: Database connection failed
**Solution**: 
1. Verify N8N_DB_PASSWORD environment variable is set in Portainer
2. Check that n8nuser exists in PostgreSQL
3. Verify n8n database was created

### Issue: Webhook URL not accessible
**Solution**: Check Cloudflare Tunnel configuration for preview-n8n.clubomatic.ai

## Expected Log Output

When n8n starts successfully, you should see:
```
n8n ready on 0.0.0.0:5678
Initializing n8n process
```

## Volume Permissions

The n8n container runs as user 1000:1000. Ensure the volume has correct permissions:
```bash
# Check current permissions
ls -la /mnt/truenas/docker_volumes/project-unity/preview/

# Fix if needed
sudo chown -R 1000:1000 /mnt/truenas/docker_volumes/project-unity/preview/n8n
sudo chmod -R 755 /mnt/truenas/docker_volumes/project-unity/preview/n8n
```