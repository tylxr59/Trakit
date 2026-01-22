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
echo ""

# Function to run SQL query
run_query() {
    docker compose exec -T db psql -U trakit -t -A -c "$1"
}

# Function to run SQL query with nice formatting
run_query_formatted() {
    docker compose exec -T db psql -U trakit -c "$1"
}

while true; do
    echo ""
    echo "Select an option:"
    echo "  1) User Statistics"
    echo "  2) List All Users"
    echo "  3) Habit Statistics"
    echo "  4) Delete User (by email)"
    echo "  5) View Logs"
    echo "  6) Exit"
    echo ""
    read -p "Enter option (1-6): " choice

    case $choice in
        1)
            echo ""
            echo "📊 User Statistics"
            echo "=================="
            echo ""
            
            TOTAL_USERS=$(run_query "SELECT COUNT(*) FROM users;")
            VERIFIED_USERS=$(run_query "SELECT COUNT(*) FROM users WHERE email_verified = true;")
            USERS_WITH_HABITS=$(run_query "SELECT COUNT(DISTINCT user_id) FROM habits;")
            TOTAL_HABITS=$(run_query "SELECT COUNT(*) FROM habits;")
            TOTAL_STAMPS=$(run_query "SELECT COUNT(*) FROM stamps;")
            
            echo "Total Users: $TOTAL_USERS"
            echo "Verified Users: $VERIFIED_USERS"
            echo "Users with Habits: $USERS_WITH_HABITS"
            echo "Total Habits Created: $TOTAL_HABITS"
            echo "Total Stamps: $TOTAL_STAMPS"
            
            if [ "$TOTAL_USERS" -gt 0 ]; then
                AVG_HABITS=$(run_query "SELECT ROUND(AVG(habit_count)::numeric, 2) FROM (SELECT COUNT(*) as habit_count FROM habits GROUP BY user_id) as counts;")
                echo "Average Habits per User: ${AVG_HABITS:-0}"
            fi
            ;;
            
        2)
            echo ""
            echo "👥 All Users"
            echo "============"
            echo ""
            run_query_formatted "SELECT 
                email, 
                email_verified as verified,
                to_char(created_at, 'YYYY-MM-DD HH24:MI') as joined
            FROM users 
            ORDER BY created_at DESC;"
            ;;
            
        3)
            echo ""
            echo "📈 Habit Statistics"
            echo "==================="
            echo ""
            
            echo "Habits per User:"
            run_query_formatted "SELECT 
                u.email,
                COUNT(h.id) as habit_count,
                COALESCE(SUM((SELECT COUNT(*) FROM stamps WHERE habit_id = h.id)), 0) as total_stamps
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
            
        4)
            read -p "Enter user email to DELETE: " user_email
            
            if [ -z "$user_email" ]; then
                echo "Error: Email cannot be empty"
                continue
            fi
            
            USER_ID=$(run_query "SELECT id FROM users WHERE email = '$user_email';")
            
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
            
            # Delete in order: stamps -> habits -> sessions -> user
            run_query "DELETE FROM stamps WHERE habit_id IN (SELECT id FROM habits WHERE user_id = '$USER_ID');"
            run_query "DELETE FROM habits WHERE user_id = '$USER_ID';"
            run_query "DELETE FROM user_sessions WHERE user_id = '$USER_ID';"
            run_query "DELETE FROM email_verification_codes WHERE user_id = '$USER_ID';"
            run_query "DELETE FROM users WHERE id = '$USER_ID';"
            
            echo "✅ User deleted successfully"
            ;;
            
        5)
            echo ""
            echo "📜 Application Logs (last 50 lines)"
            echo "===================================="
            echo ""
            docker compose logs --tail=50 app
            
            echo ""
            read -p "Press Enter to continue..."
            ;;
            
        6)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
            
        *)
            echo "Invalid option. Please try again."
            ;;
    esac
done
