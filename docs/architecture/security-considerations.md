# Security Considerations

## Infrastructure Security
- **Cloudflare Zero Trust:** No exposed ports, DDoS protection
- **Tailscale VPN:** Encrypted CI/CD connections
- **Docker Secrets:** Sensitive data management
- **Network Isolation:** Separate networks for services

## Application Security
- **Magic Link Auth:** No passwords to compromise
- **JWT Sessions:** Secure, stateless authentication
- **HTTPS Only:** Enforced via Cloudflare
- **Environment Variables:** Injected at runtime, not in images
- **Rate Limiting:** Redis-based request throttling
- **CORS Configuration:** Strict origin policies

## Data Security
- **Encrypted Backups:** Automated daily backups
- **Volume Encryption:** Docker volume encryption
- **Database Connection:** SSL/TLS required
- **Audit Logging:** All auth events logged
