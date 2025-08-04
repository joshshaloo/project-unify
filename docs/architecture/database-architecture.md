# Database Architecture

## PostgreSQL Configuration

**Environment Separation:**
- Each environment gets its own PostgreSQL database
- Databases are isolated in separate containers
- No shared data between environments

**Connection Management:**
```yaml