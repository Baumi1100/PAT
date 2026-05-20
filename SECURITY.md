# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x     | ✅        |

## Reporting a Vulnerability

Email: security@[your-domain] or open a GitHub Security Advisory.

Do NOT open a public issue for security vulnerabilities.

## Security Measures

- JWT authentication with configurable expiry
- bcrypt password hashing (constant-time comparison)
- Input validation via Pydantic
- Secrets exclusively via environment variables — never committed
- Minimal logging of personal data
- File upload validation (type + size limits)
- CORS configured via environment variable
