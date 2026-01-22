# Trakit - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database URL

# 3. Run migrations
npm run migrate:up

# 4. Start dev server
npm run dev
```

Visit http://localhost:5173

### Option 2: Docker (Production)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings

# 2. Start all services
docker-compose up -d
```

Visit http://localhost (or your domain)

### Option 3: Deploy to Hetzner

```bash
bash deploy-hetzner.sh
```

Follow the prompts to deploy to your Hetzner VPS.

## 📝 First Steps

1. **Create an account** at `/signup`
2. **Add your first habit** on the dashboard
3. **Click the checkmark** to mark today as complete
4. **Watch your streak grow** in the calendar grid!

## 🔒 Disable Public Registration

After creating your account:

```bash
# Edit .env
ALLOW_REGISTRATION=false

# Restart app
docker-compose restart app
# or for local: just restart dev server
```

## 📧 Enable Email Verification

```bash
# Edit .env
EMAIL_VERIFICATION_REQUIRED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Trakit <your-email@gmail.com>

# Restart app
docker-compose restart app
```

## 🎨 Customize Theme

Edit [`src/app.css`](src/app.css:1) to change Material 3 color tokens.

## 📚 More Info

See [README.md](README.md:1) for complete documentation.
