<div align="center">

# Trakit

**A free and open-source habit tracker with a beautiful GitHub-style calendar**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.68-orange)](https://kit.svelte.dev/)

[Homepage](https://gettrakit.app) • [Features](#features) • [Quick Start](#quick-start) • [Deployment](#deployment) • [Documentation](#documentation)

</div>

---

## Overview

Trakit is a self-hosted habit tracking application built with SvelteKit, TypeScript, and SQLite. Track your daily habits with visual calendar grids, secure authentication, and a beautiful Material 3 design—all while keeping your data private on your own server.

## Features

- 🎨 **Material 3 Design** - Beautiful, modern UI with dark/light mode
- 📊 **GitHub-style Calendar** - Visual habit tracking with color-coded squares
- 🔐 **Secure Authentication** - Custom session management with CSRF protection and optional email verification
- 🐳 **Docker Ready** - One-command deployment with auto-HTTPS
- 🔒 **Privacy First** - Self-hosted, no external SaaS dependencies
- ⚡ **Fast & Responsive** - Optimized for performance on all devices
- 🧪 **Production Ready** - Tested with ESLint, Prettier, and Vitest

## Tech Stack

- **Frontend**: SvelteKit 2.68 (Svelte 5), TypeScript, Tailwind CSS
- **Backend**: SvelteKit API routes, custom session-based authentication with CSRF protection
- **Database**: SQLite with file-based migrations
- **Icons**: Iconify (Material Symbols)
- **Email**: Nodemailer (SMTP)
- **Deployment**: Docker, Docker Compose, Caddy (auto-HTTPS)

## Quick Start

### Prerequisites

- Node.js 20+
- npm
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
SQLITE_DB_PATH=./data/trakit.db
EMAIL_VERIFICATION_REQUIRED=false
ALLOW_REGISTRATION=true
TRUST_PROXY=false
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

### Management Scripts

Once installed, you have access to the admin script in `/opt/trakit/`:

**Admin dashboard** for management, updates, and statistics:

```bash
cd /opt/trakit && sudo ./admin.sh
```

Available admin functions:

- View user statistics
- List all users
- View habit statistics
- Delete users
- View application logs
- Update application to latest version
- Start services (after reboot)

### Post-Installation

**Admin dashboard** for updates, management, and statistics:

```bash
cd /opt/trakit && sudo ./admin.sh
```

**Disable public registration** after creating your account:

1. Edit `/opt/trakit/.env` and set `ALLOW_REGISTRATION=false`
2. Restart: `cd /opt/trakit && docker compose restart app`

## Documentation

### Environment Variables

| Variable                      | Required      | Default                 | Description                 |
| ----------------------------- | ------------- | ----------------------- | --------------------------- |
| `SQLITE_DB_PATH`              | No            | `./data/trakit.db`      | SQLite database file path   |
| `EMAIL_VERIFICATION_REQUIRED` | No            | `false`                 | Enable email verification   |
| `ALLOW_REGISTRATION`          | No            | `true`                  | Allow new user registration |
| `SMTP_HOST`                   | Conditional\* | -                       | SMTP server hostname        |
| `SMTP_PORT`                   | Conditional\* | `587`                   | SMTP server port            |
| `SMTP_USER`                   | Conditional\* | -                       | SMTP username               |
| `SMTP_PASSWORD`               | Conditional\* | -                       | SMTP password               |
| `SMTP_FROM`                   | Conditional\* | -                       | Email sender address        |
| `PUBLIC_APP_URL`              | No            | `http://localhost:5173` | Public URL of the app       |
| `TRUST_PROXY`                 | No            | `false`                 | Trust proxy IP headers      |

\* Required only if `EMAIL_VERIFICATION_REQUIRED=true`

### Database Migrations

```bash
# Create migration
npm run migrate:create -- migration-name

# Run migrations
npm run migrate:up

# Rollback is intentionally not implemented for SQLite migrations yet
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
4. Run checks (`npm run check && npm run lint && npm test`)
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
- [SQLite](https://www.sqlite.org/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Iconify](https://iconify.design/) - Icons
- [@oslojs](https://oslojs.dev/) - Cryptographic utilities

---

<div align="center">

Made with ❤️ by tylxr

⭐ Star this repo if you find it useful!

</div>
