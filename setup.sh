#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

echo "🚀 Trakit - Local Deployment Script"
echo "===================================="
echo ""

# Prompt for configuration
read -p "Enter your domain (e.g., trakit.example.com): " DOMAIN
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
read -p "Require email verification? (y/n, default: y): " EMAIL_VERIFY
EMAIL_VERIFY=${EMAIL_VERIFY:-y}
if [[ $EMAIL_VERIFY =~ ^[Yy]$ ]]; then
    EMAIL_VERIFICATION_REQUIRED="true"
    read -p "Enter your email for SMTP: " SMTP_USER
    read -sp "Enter SMTP password: " SMTP_PASSWORD
    echo ""
else
    EMAIL_VERIFICATION_REQUIRED="false"
fi

echo ""
echo "📋 Configuration Summary:"
echo "  Domain: $DOMAIN"
echo "  Email Verification: $EMAIL_VERIFICATION_REQUIRED"
if [[ $EMAIL_VERIFICATION_REQUIRED == "true" ]]; then
    echo "  SMTP User: $SMTP_USER"
fi
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "🔧 Installing Docker and dependencies..."

# Update system
apt-get update
apt-get upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi

echo ""
echo "⚙️  Configuring environment..."

# Set up app directory
APP_DIR="/opt/trakit"

# Clone repository
if [ -d "$APP_DIR" ]; then
    echo "📦 Updating existing repository..."
    cd $APP_DIR
    git pull
else
    echo "📦 Cloning repository from GitHub..."
    git clone https://github.com/tylxr59/Trakit.git $APP_DIR
    cd $APP_DIR
fi

# Create .env file
cat > .env << EOF
DB_PASSWORD=$DB_PASSWORD
DOMAIN=$DOMAIN
EMAIL_VERIFICATION_REQUIRED=$EMAIL_VERIFICATION_REQUIRED
ALLOW_REGISTRATION=true
PUBLIC_APP_URL=https://$DOMAIN
EOF

# Add SMTP settings if email verification is enabled
if [[ $EMAIL_VERIFICATION_REQUIRED == "true" ]]; then
    cat >> .env << EOF
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=Trakit <$SMTP_USER>
EOF
fi

chmod 600 .env

echo ""
echo "🐳 Starting Docker containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your Trakit instance is now running at: https://$DOMAIN"
echo ""
echo "📝 Next steps:"
echo "  1. Wait a few minutes for SSL certificate provisioning"
echo "  2. Visit https://$DOMAIN and create your account"
echo "  3. Set ALLOW_REGISTRATION=false in .env to disable public registration"
echo "  4. Restart with: docker compose restart app"
echo ""
echo "🔍 Useful commands:"
echo "  View logs: docker compose logs -f"
echo "  Restart: docker compose restart"
echo "  Stop: docker compose down"
echo ""
