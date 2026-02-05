/**
 * Notification scheduler
 *
 * Runs a cron job every minute to check if users need reminders
 * Uses user's timezone to determine when to send notifications
 */

import cron from 'node-cron';
import { DateTime } from 'luxon';
import { pool } from './db';
import { logger } from './logger';
import {
	sendWebPushNotification,
	sendNtfyNotification,
	createReminderMessage
} from './notifications';

/**
 * Check if current time matches user's reminder time in their timezone
 */
function isTimeForReminder(userTimezone: string, reminderTime: string): boolean {
	try {
		// Get current time in user's timezone
		const now = DateTime.now().setZone(userTimezone);
		const currentTime = now.toFormat('HH:mm');

		// Check if it matches the reminder time
		return currentTime === reminderTime;
	} catch (error) {
		logger.error('Failed to check reminder time', {
			error: error instanceof Error ? error.message : String(error),
			userTimezone,
			reminderTime
		});
		return false;
	}
}

/**
 * Get incomplete habits for a user today
 */
async function getIncompleteHabitsForUser(
	userId: string,
	userTimezone: string
): Promise<Array<{ id: string; name: string; frequency: string }>> {
	try {
		// Get today's date in user's timezone
		const today = DateTime.now().setZone(userTimezone).toISODate();

		// Get all active habits for user
		const habitsResult = await pool.query(
			'SELECT id, name, frequency FROM habits WHERE user_id = $1 ORDER BY sort_order ASC',
			[userId]
		);

		// Get today's completions
		const stampsResult = await pool.query(
			'SELECT habit_id FROM habit_stamps WHERE habit_id = ANY($1::uuid[]) AND day = $2 AND value = 1',
			[habitsResult.rows.map((h) => h.id), today]
		);

		const completedHabitIds = new Set(stampsResult.rows.map((s) => s.habit_id));

		// Filter to incomplete habits
		const incompleteHabits = habitsResult.rows.filter((habit) => {
			// For weekly/monthly habits, we still show them as incomplete if not done today
			// This keeps the reminder simple - "you haven't completed these today"
			return !completedHabitIds.has(habit.id);
		});

		return incompleteHabits;
	} catch (error) {
		logger.error('Failed to get incomplete habits', {
			error: error instanceof Error ? error.message : String(error),
			userId
		});
		return [];
	}
}

/**
 * Send reminder to a user
 */
async function sendReminderToUser(user: {
	id: string;
	reminder_service: 'push' | 'ntfy';
	push_subscription: unknown;
	ntfy_url_encrypted: string | null;
	ntfy_encryption_iv: string | null;
	timezone: string | null;
}): Promise<void> {
	try {
		// Get incomplete habits
		const incompleteHabits = await getIncompleteHabitsForUser(user.id, user.timezone || 'UTC');

		// Skip if all habits are complete (but send a congratulatory message)
		const message = createReminderMessage(incompleteHabits);

		// Send based on service preference
		if (user.reminder_service === 'push') {
			if (!user.push_subscription) {
				logger.warn('Push subscription missing for user', { userId: user.id });
				return;
			}

			const result = await sendWebPushNotification(
				user.push_subscription as PushSubscription,
				message
			);

			if (!result.success) {
				if (result.error === 'subscription_expired') {
					// Clear expired subscription from database
					await pool.query('UPDATE users SET push_subscription = NULL WHERE id = $1', [user.id]);
					logger.info('Cleared expired push subscription', { userId: user.id });
				} else {
					logger.error('Failed to send push notification', {
						userId: user.id,
						error: result.error
					});
				}
			}
		} else if (user.reminder_service === 'ntfy') {
			if (!user.ntfy_url_encrypted || !user.ntfy_encryption_iv) {
				logger.warn('Ntfy configuration missing for user', { userId: user.id });
				return;
			}

			const result = await sendNtfyNotification(
				user.ntfy_url_encrypted,
				user.ntfy_encryption_iv,
				message
			);

			if (!result.success) {
				logger.error('Failed to send Ntfy notification', {
					userId: user.id,
					error: result.error
				});
			}
		}
	} catch (error) {
		logger.error('Failed to send reminder to user', {
			error: error instanceof Error ? error.message : String(error),
			userId: user.id
		});
	}
}

/**
 * Check for users who need reminders right now
 */
async function checkAndSendReminders(): Promise<void> {
	try {
		// Get all users with reminders enabled
		const result = await pool.query(
			`SELECT 
				id, 
				reminder_service, 
				reminder_time, 
				timezone, 
				push_subscription, 
				ntfy_url_encrypted, 
				ntfy_encryption_iv
			FROM users 
			WHERE reminder_enabled = true 
			AND reminder_service IS NOT NULL 
			AND reminder_time IS NOT NULL`
		);

		if (result.rows.length === 0) {
			logger.debug('No users with reminders enabled');
			return;
		}

		logger.debug(`Checking reminders for ${result.rows.length} users`);

		// Check each user and send reminders if it's their time
		for (const user of result.rows) {
			const userTimezone = user.timezone || 'UTC';

			if (isTimeForReminder(userTimezone, user.reminder_time)) {
				logger.info('Sending reminder to user', {
					userId: user.id,
					timezone: userTimezone,
					reminderTime: user.reminder_time
				});

				// Send reminder (don't await to avoid blocking other users)
				sendReminderToUser(user).catch((error) => {
					logger.error('Failed to send reminder', {
						error: error instanceof Error ? error.message : String(error),
						userId: user.id
					});
				});
			}
		}
	} catch (error) {
		logger.error('Failed to check and send reminders', {
			error: error instanceof Error ? error.message : String(error)
		});
	}
}

/**
 * Start the reminder scheduler
 * Runs every minute to check for pending reminders
 */
export function startReminderScheduler(): void {
	// Run every minute
	cron.schedule('* * * * *', () => {
		checkAndSendReminders().catch((error) => {
			logger.error('Reminder scheduler error', {
				error: error instanceof Error ? error.message : String(error)
			});
		});
	});

	logger.info('Reminder scheduler started (runs every minute)');
}
