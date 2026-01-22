# Trakit

A free and open-source habit tracker built with SvelteKit, TypeScript, and PostgreSQL. Track your daily habits with a beautiful GitHub-style calendar grid and Material 3 design.

## Features

- 🎨 **Material 3 Design** - Beautiful, modern UI with dark/light mode
- 📊 **GitHub-style Calendar** - Visual habit tracking with green squares
- 🔐 **Secure Authentication** - Lucia auth with optional email verification
- 📧 **Email Verification** - Optional SMTP-based email verification with 6-digit codes
- 🐳 **Docker Ready** - Complete Docker Compose setup with PostgreSQL and Caddy
- 🔒 **Privacy First** - Self-hosted, no external SaaS dependencies
- ⚡ **Fast & Responsive** - Built with SvelteKit and optimized for performance
- 🧪 **Tested** - ESLint, Prettier, and Vitest for code quality

## Tech Stack

- **Frontend**: SvelteKit (Svelte 5), TypeScript, Tailwind CSS
- **Backend**: SvelteKit API routes, Lucia auth
- **Database**: PostgreSQL 16 with node-pg-migrate
- **Icons**: Iconify (Material Symbols)
- **Email**: Nodemailer (SMTP)
- **Deployment**: Docker, Docker Compose, Caddy (auto-HTTPS)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- SMTP server (optional, for email verification)

### Local Development

1. **Clone the repository**

\`\`\`bash
git clone https://github.com/yourusername/trakit.git
cd trakit
\`\`\`

2. **Install dependencies**

\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration:

\`\`\`env
# Database
DATABASE_URL=postgresql://trakit:trakit@localhost:5432/trakit

# Auth
EMAIL_VERIFICATION_REQUIRED=false
ALLOW_REGISTRATION=true

# SMTP (only needed if EMAIL_VERIFICATION_REQUIRED=true)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=Trakit <noreply@example.com>

# App
PUBLIC_APP_URL=http://localhost:5173
\`\`\`

4. **Run database migrations**

\`\`\`bash
npm run migrate:up
\`\`\`

5. **Start development server**

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:5173](http://localhost:5173)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `EMAIL_VERIFICATION_REQUIRED` | No | `false` | Enable email verification for new users |
| `ALLOW_REGISTRATION` | No | `true` | Allow new user registration |
| `SMTP_HOST` | If email verification enabled | - | SMTP server hostname |
| `SMTP_PORT` | If email verification enabled | `587` | SMTP server port |
| `SMTP_USER` | If email verification enabled | - | SMTP username |
| `SMTP_PASSWORD` | If email verification enabled | - | SMTP password |
| `SMTP_FROM` | If email verification enabled | - | Email sender address |
| `PUBLIC_APP_URL` | No | `http://localhost:5173` | Public URL of the app |

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Create environment file**

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your production settings:

\`\`\`env
DB_PASSWORD=your-secure-password
DOMAIN=trakit.yourdomain.com
EMAIL_VERIFICATION_REQUIRED=true
ALLOW_REGISTRATION=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Trakit <your-email@gmail.com>
PUBLIC_APP_URL=https://trakit.yourdomain.com
\`\`\`

2. **Start services**

\`\`\`bash
docker-compose up -d
\`\`\`

The app will be available at your domain with automatic HTTPS via Caddy.

### Disable Public Registration

To disable public registration after creating your account:

1. Set `ALLOW_REGISTRATION=false` in your `.env` file
2. Restart the app: `docker-compose restart app`

Existing users can still log in, but new registrations will be blocked.

## Deploy to Hetzner

Use the included deployment script to quickly deploy to a Hetzner VPS:

\`\`\`bash
bash deploy-hetzner.sh
\`\`\`

The script will:
1. Prompt for server details (IP, SSH key, domain)
2. Set up Docker and Docker Compose
3. Clone the repository
4. Configure environment variables
5. Start the application with auto-HTTPS

## Database Migrations

### Create a new migration

\`\`\`bash
npm run migrate:create migration-name
\`\`\`

### Run migrations

\`\`\`bash
npm run migrate:up
\`\`\`

### Rollback migrations

\`\`\`bash
npm run migrate:down
\`\`\`

## Development

### Code Quality

\`\`\`bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run check

# Run tests
npm test
\`\`\`

### Project Structure

\`\`\`
trakit/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CalendarGrid.svelte    # GitHub-style calendar
│   │   │   └── HabitCard.svelte       # Habit display card
│   │   ├── server/
│   │   │   ├── db.ts                  # Database connection
│   │   │   ├── lucia.ts               # Auth configuration
│   │   │   └── email.ts               # Email sending
│   │   └── stores/
│   │       └── theme.svelte.ts        # Dark/light mode
│   ├── routes/
│   │   ├── api/
│   │   │   └── stamp/                 # Stamp toggle API
│   │   ├── login/                     # Login page
│   │   ├── signup/                    # Signup page
│   │   ├── logout/                    # Logout endpoint
│   │   └── +page.svelte               # Dashboard
│   ├── app.css                        # Global styles
│   └── app.html                       # HTML template
├── migrations/                        # Database migrations
├── docker-compose.yml                 # Docker orchestration
├── Dockerfile                         # App container
└── Caddyfile                          # Reverse proxy config
\`\`\`

## Email Verification

When `EMAIL_VERIFICATION_REQUIRED=true`:

1. Users sign up with email and password
2. A 6-digit code is sent to their email
3. Users enter the code on the login page
4. Email is verified and they can access the app

The verification code expires after 15 minutes.

## Material 3 Design

The app uses Material 3 design tokens for consistent theming:

- Dynamic color system with light/dark modes
- Material Icons via Iconify
- Responsive layouts
- Smooth transitions and animations

Theme colors are defined in `src/app.css` and can be customized.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report a bug](https://github.com/yourusername/trakit/issues)
- 💡 [Request a feature](https://github.com/yourusername/trakit/issues)
- 📖 [Documentation](https://github.com/yourusername/trakit/wiki)

## Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Authentication by [Lucia](https://lucia-auth.com/)
- Icons from [Iconify](https://iconify.design/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
