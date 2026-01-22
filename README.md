<div align="center">

# Trakit

**A free and open-source habit tracker with a beautiful GitHub-style calendar**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.14-orange)](https://kit.svelte.dev/)

[Features](#features) • [Quick Start](#quick-start) • [Deployment](#deployment) • [Documentation](#documentation)

</div>

---

## Overview

Trakit is a self-hosted habit tracking application built with SvelteKit, TypeScript, and PostgreSQL. Track your daily habits with visual calendar grids, secure authentication, and a beautiful Material 3 design—all while keeping your data private on your own server.

## Features

- 🎨 **Material 3 Design** - Beautiful, modern UI with dark/light mode
- 📊 **GitHub-style Calendar** - Visual habit tracking with color-coded squares
- 🔐 **Secure Authentication** - Lucia auth with optional email verification
- 🐳 **Docker Ready** - One-command deployment with auto-HTTPS
- 🔒 **Privacy First** - Self-hosted, no external SaaS dependencies
- ⚡ **Fast & Responsive** - Optimized for performance on all devices
- 🧪 **Production Ready** - Tested with ESLint, Prettier, and Vitest

## Tech Stack

- **Frontend**: SvelteKit 2.14 (Svelte 5), TypeScript, Tailwind CSS
- **Backend**: SvelteKit API routes, Lucia auth
- **Database**: PostgreSQL 16 with migrations
- **Icons**: Iconify (Material Symbols)
- **Email**: Nodemailer (SMTP)
- **Deployment**: Docker, Docker Compose, Caddy (auto-HTTPS)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- SMTP server (optional, for email verification)

### Local Development

1. **Clone and install**

```bash
git clone https://github.com/tylxr59/Trakit.git
cd trakit
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DATABASE_URL=postgresql://trakit:trakit@localhost:5432/trakit
EMAIL_VERIFICATION_REQUIRED=false
ALLOW_REGISTRATION=true
PUBLIC_APP_URL=http://localhost:5173
```

3. **Run migrations and start**

```bash
npm run migrate:up
npm run dev
```

Visit **http://localhost:5173**

## Deployment

### Production Setup (Debian/Ubuntu)

Deploy to your server with a single command:

```bash
curl -fsSL https://github.com/tylxr59/Trakit/raw/refs/heads/main/setup.sh -o setup.sh && sudo bash setup.sh
```

**What it does:**
- Installs Docker and dependencies
- Clones the repository
- Prompts for domain and SMTP settings
- Configures environment variables
- Starts the app with auto-HTTPS via Caddy

### Updating

Update to the latest version:

```bash
curl -fsSL https://github.com/tylxr59/Trakit/raw/refs/heads/main/update.sh -o update.sh && sudo bash update.sh
```

### Post-Installation

**Disable public registration** after creating your account:

1. Edit `/opt/trakit/.env` and set `ALLOW_REGISTRATION=false`
2. Restart: `cd /opt/trakit && docker compose restart app`

## Documentation

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `EMAIL_VERIFICATION_REQUIRED` | No | `false` | Enable email verification |
| `ALLOW_REGISTRATION` | No | `true` | Allow new user registration |
| `SMTP_HOST` | Conditional* | - | SMTP server hostname |
| `SMTP_PORT` | Conditional* | `587` | SMTP server port |
| `SMTP_USER` | Conditional* | - | SMTP username |
| `SMTP_PASSWORD` | Conditional* | - | SMTP password |
| `SMTP_FROM` | Conditional* | - | Email sender address |
| `PUBLIC_APP_URL` | No | `http://localhost:5173` | Public URL of the app |

\* Required only if `EMAIL_VERIFICATION_REQUIRED=true`

### Database Migrations

```bash
# Create migration
npm run migrate:create migration-name

# Run migrations
npm run migrate:up

# Rollback
npm run migrate:down
```

### Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Lint code
npm run format       # Format code
npm run check        # Type check
npm test             # Run tests
```

### Project Structure

```
trakit/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── server/         # Server-side utilities
│   │   └── stores/         # State management
│   └── routes/             # SvelteKit routes
├── migrations/             # Database migrations
├── docker-compose.yml      # Docker orchestration
└── Dockerfile             # Container definition
```

## Email Verification

When enabled, users receive a 6-digit verification code via email during signup. The code expires after 15 minutes.

**Configuration:**
1. Set `EMAIL_VERIFICATION_REQUIRED=true`
2. Configure SMTP settings
3. Test with your email provider (Gmail, SendGrid, etc.)

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint && npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report a bug](https://github.com/tylxr59/Trakit/issues)
- 💡 [Request a feature](https://github.com/tylxr59/Trakit/issues)
- 📖 [Documentation](https://github.com/tylxr59/Trakit)

## Acknowledgments

Built with amazing open-source tools:

- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Lucia](https://lucia-auth.com/) - Authentication
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Iconify](https://iconify.design/) - Icons

---

<div align="center">

Made with ❤️ by tylxr

⭐ Star this repo if you find it useful!

</div>
