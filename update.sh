#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

echo "🔄 Trakit - Update Script"
echo "========================="
echo ""

# Navigate to app directory
APP_DIR="/opt/trakit"
cd $APP_DIR

echo "🛑 Stopping Docker containers..."
docker compose down

echo ""
echo "📥 Pulling latest changes from GitHub..."
git pull

echo ""
echo "🐳 Rebuilding and starting Docker containers..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "✅ Update complete!"
echo ""
echo "🔍 Useful commands:"
echo "  View logs: docker compose logs -f"
echo "  Check status: docker compose ps"
echo ""
