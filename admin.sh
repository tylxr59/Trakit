#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

APP_DIR="/opt/trakit"

# Check if running from app directory
if [ ! -d "$APP_DIR" ]; then
    echo "Error: Trakit installation not found at $APP_DIR"
    exit 1
fi

cd $APP_DIR

echo "🔧 Trakit - Admin Dashboard"
echo "==========================="

# Function to run SQL query
run_query() {
    docker compose exec -T app node scripts/query-sqlite.mjs --value "$1"
}

# Function to run SQL query with nice formatting
run_query_formatted() {
    docker compose exec -T app node scripts/query-sqlite.mjs --table "$1"
}

sql_escape() {
    printf "%s" "$1" | sed "s/'/''/g"
}

while true; do
    echo ""
    echo "Select an option:"
    echo "  1) Start Services"
    echo "  2) Update Application"
    echo "  3) User Statistics"
    echo "  4) List All Users"
    echo "  5) Habit Statistics"
    echo "  6) Delete User (by email)"
    echo "  7) View Logs"
    echo "  8) Set Autostart (Docker)"
    echo "  9) Exit"
    echo ""
    read -p "Enter option (1-9): " choice

    case $choice in
        1)
            echo ""
            echo "🚀 Start Services"
            echo "================="
            echo ""
            
            echo "Starting Docker containers..."
            docker compose up -d
            
            echo ""
            echo "⏳ Waiting for services to start..."
            sleep 5
            
            echo ""
            echo "✅ Services started!"
            echo ""
            echo "🔍 Service status:"
            docker compose ps
            echo ""
            read -p "Press Enter to continue..."
            ;;

        2)
            echo ""
            echo "🔄 Update Application"
            echo "====================="
            echo ""
            
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
            sleep 5
            
            echo ""
            echo "🔄 Running database migrations..."
            docker compose exec -T app npm run migrate:up || {
                echo "⚠️  Warning: Migration command failed or no migrations to run"
            }
            
            echo ""
            echo "✅ Update complete!"
            echo ""
            read -p "Press Enter to continue..."
            ;;

        3)
            echo ""
            echo "📊 User Statistics"
            echo "=================="
            echo ""
            
            TOTAL_USERS=$(run_query "SELECT COUNT(*) FROM users;")
            VERIFIED_USERS=$(run_query "SELECT COUNT(*) FROM users WHERE email_verified = true;")
            USERS_WITH_HABITS=$(run_query "SELECT COUNT(DISTINCT user_id) FROM habits;")
            TOTAL_HABITS=$(run_query "SELECT COUNT(*) FROM habits;")
            TOTAL_STAMPS=$(run_query "SELECT COUNT(*) FROM habit_stamps;")
            
            echo "Total Users: $TOTAL_USERS"
            echo "Verified Users: $VERIFIED_USERS"
            echo "Users with Habits: $USERS_WITH_HABITS"
            echo "Total Habits Created: $TOTAL_HABITS"
            echo "Total Stamps: $TOTAL_STAMPS"
            
            if [ "$TOTAL_USERS" -gt 0 ]; then
                AVG_HABITS=$(run_query "SELECT ROUND(AVG(habit_count), 2) FROM (SELECT COUNT(*) as habit_count FROM habits GROUP BY user_id) as counts;")
                echo "Average Habits per User: ${AVG_HABITS:-0}"
            fi
            ;;
            
        4)
            echo ""
            echo "👥 All Users"
            echo "============"
            echo ""
            run_query_formatted "SELECT 
                email, 
                email_verified as verified,
                strftime('%Y-%m-%d %H:%M', created_at) as joined
            FROM users 
            ORDER BY created_at DESC;"
            ;;
            
        5)
            echo ""
            echo "📈 Habit Statistics"
            echo "==================="
            echo ""
            
            echo "Habits per User:"
            run_query_formatted "SELECT 
                u.email,
                COUNT(h.id) as habit_count,
                COALESCE(SUM((SELECT COUNT(*) FROM habit_stamps WHERE habit_id = h.id)), 0) as total_stamps
            FROM users u
            LEFT JOIN habits h ON u.id = h.user_id
            GROUP BY u.id, u.email
            ORDER BY habit_count DESC;"
            
            echo ""
            echo "Most Popular Habit Colors:"
            run_query_formatted "SELECT 
                color,
                COUNT(*) as count
            FROM habits
            GROUP BY color
            ORDER BY count DESC
            LIMIT 10;"
            ;;
            
        6)
            read -p "Enter user email to DELETE: " user_email
            
            if [ -z "$user_email" ]; then
                echo "Error: Email cannot be empty"
                continue
            fi
            
            escaped_email=$(sql_escape "$user_email")
            USER_ID=$(run_query "SELECT id FROM users WHERE email = '$escaped_email';")
            
            if [ -z "$USER_ID" ]; then
                echo "Error: User not found"
                continue
            fi
            
            echo ""
            echo "⚠️  WARNING: This will permanently delete user '$user_email' and all their data!"
            read -p "Type 'DELETE' to confirm: " confirm
            
            if [ "$confirm" != "DELETE" ]; then
                echo "Deletion cancelled"
                continue
            fi
            
            echo ""
            echo "Deleting user data..."
            
            escaped_user_id=$(sql_escape "$USER_ID")
            run_query "DELETE FROM users WHERE id = '$escaped_user_id';"
            
            echo "✅ User deleted successfully"
            ;;
            
        7)
            echo ""
            echo "📜 Application Logs (last 50 lines)"
            echo "===================================="
            echo ""
            docker compose logs --tail=50 app
            
            echo ""
            read -p "Press Enter to continue..."
            ;;
            
        8)
            echo ""
            echo "🔄 Docker Autostart Configuration"
            echo "=================================="
            echo ""
            
            # Get current restart policy for app container
            CURRENT_POLICY=$(docker inspect trakit-app --format='{{.HostConfig.RestartPolicy.Name}}' 2>/dev/null || echo "unknown")
            
            if [ "$CURRENT_POLICY" = "unknown" ]; then
                echo "⚠️  Warning: Containers may not be running. Start services first (option 1)."
                echo ""
                read -p "Press Enter to continue..."
                continue
            fi
            
            echo "Current autostart status:"
            if [ "$CURRENT_POLICY" = "unless-stopped" ] || [ "$CURRENT_POLICY" = "always" ]; then
                echo "  ✅ ENABLED - Containers will start automatically on system boot"
                echo ""
                read -p "Do you want to DISABLE autostart? (yes/no): " confirm
                
                if [ "$confirm" = "yes" ]; then
                    echo ""
                    echo "Disabling autostart for all containers..."
                    for container in $(docker compose ps -q); do
                        docker update --restart=no $container >/dev/null 2>&1
                    done
                    echo "✅ Autostart disabled. Containers will not start on system boot."
                fi
            else
                echo "  ❌ DISABLED - Containers will NOT start automatically on system boot"
                echo ""
                read -p "Do you want to ENABLE autostart? (yes/no): " confirm
                
                if [ "$confirm" = "yes" ]; then
                    echo ""
                    echo "Enabling autostart for all containers..."
                    for container in $(docker compose ps -q); do
                        docker update --restart=unless-stopped $container >/dev/null 2>&1
                    done
                    echo "✅ Autostart enabled. Containers will start automatically on system boot."
                fi
            fi
            
            echo ""
            read -p "Press Enter to continue..."
            ;;
            
        9)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
            
        *)
            echo "Invalid option. Please try again."
            ;;
    esac
done
