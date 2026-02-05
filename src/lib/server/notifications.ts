/**
 * Notification service utilities
 *
 * Handles sending notifications via:
 * 1. Web Push (PWA push notifications)
 * 2. Ntfy (self-hosted push notification service)
 */

import webPush from 'web-push';
import { env } from '$env/dynamic/private';
import { logger } from './logger';
import { decryptNtfyUrl } from './encryption';

// Initialize VAPID keys for web push
// Note: VAPID_PUBLIC_KEY is also exposed as PUBLIC_VAPID_KEY for client use
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
	webPush.setVapidDetails(`mailto:${env.VAPID_EMAIL}`, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
} else {
	logger.warn('VAPID keys not configured - push notifications will not work');
}

export interface NotificationPayload {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	tag?: string;
	data?: Record<string, unknown>;
}

/**
 * Send push notification via Web Push API
 */
export async function sendWebPushNotification(
	subscription: PushSubscription,
	payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
	try {
		if (!env.PUBLIC_VAPID_KEY || !env.VAPID_PRIVATE_KEY) {
			return { success: false, error: 'Web push not configured' };
		}

		const pushPayload = JSON.stringify({
			title: payload.title,
			body: payload.body,
			icon: payload.icon || '/icon-192.png',
			badge: payload.badge || '/icon-192.png',
			tag: payload.tag || 'habit-reminder',
			data: payload.data || {}
		});

		await webPush.sendNotification(
			subscription as unknown as webPush.PushSubscription,
			pushPayload
		);

		logger.info('Web push notification sent successfully');
		return { success: true };
	} catch (error) {
		// Handle specific errors
		if (error && typeof error === 'object' && 'statusCode' in error) {
			const statusCode = (error as { statusCode: number }).statusCode;

			// 410 Gone - subscription expired
			if (statusCode === 410 || statusCode === 404) {
				logger.info('Push subscription expired or invalid');
				return { success: false, error: 'subscription_expired' };
			}
		}

		logger.error('Failed to send web push notification', {
			error: error instanceof Error ? error.message : String(error)
		});
		return { success: false, error: 'Failed to send notification' };
	}
}

/**
 * Send notification via Ntfy
 *
 * @param ntfyUrlEncrypted - Encrypted Ntfy URL (includes auth)
 * @param encryptionIv - Initialization vector for decryption
 * @param payload - Notification content
 */
export async function sendNtfyNotification(
	ntfyUrlEncrypted: string,
	encryptionIv: string,
	payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
	try {
		// Decrypt the Ntfy URL
		const ntfyUrl = decryptNtfyUrl(ntfyUrlEncrypted, encryptionIv);
		if (!ntfyUrl) {
			logger.error('Failed to decrypt Ntfy URL');
			return { success: false, error: 'Invalid Ntfy configuration' };
		}

		// Parse URL to extract auth if present
		const url = new URL(ntfyUrl);

		// Strip emojis from title and body for Node.js fetch compatibility
		// Node's fetch has issues with emojis in both headers and body
		const stripEmojis = (text: string) =>
			text
				.replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emoticons
				.replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
				.replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
				.trim();

		const headers: Record<string, string> = {
			'Content-Type': 'text/plain; charset=utf-8',
			Title: stripEmojis(payload.title),
			Priority: 'default',
			Tags: 'calendar,reminder'
		};

		// If URL has auth, convert to Authorization header
		if (url.username || url.password) {
			const credentials = Buffer.from(`${url.username}:${url.password}`).toString('base64');
			headers['Authorization'] = `Basic ${credentials}`;

			// Remove auth from URL for the request
			url.username = '';
			url.password = '';
		}

		// Send notification to Ntfy
		const response = await fetch(url.toString(), {
			method: 'POST',
			headers,
			body: stripEmojis(payload.body)
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error(`Ntfy notification failed: ${response.status} - ${errorText}`);
			return { success: false, error: `Ntfy error: ${response.status}` };
		}

		logger.info('Ntfy notification sent successfully');
		return { success: true };
	} catch (error) {
		logger.error('Failed to send Ntfy notification', {
			error: error instanceof Error ? error.message : String(error)
		});
		return { success: false, error: 'Failed to send notification' };
	}
}

/**
 * Create motivational message for incomplete habits
 */
export function createReminderMessage(
	incompleteHabits: Array<{ name: string }>
): NotificationPayload {
	const count = incompleteHabits.length;

	if (count === 0) {
		return {
			title: '🎉 All habits completed!',
			body: "Great job! You've completed all your habits for today. Keep up the momentum!",
			tag: 'habit-reminder-complete'
		};
	}

	const habitList = incompleteHabits.map((h) => `• ${h.name}`).join('\n');

	// Motivational messages
	const motivationalPhrases = [
		"You've got this! 💪",
		'Small steps lead to big changes! 🌟',
		'Keep building your streak! 🔥',
		'Progress, not perfection! ✨',
		"You're doing great! 🚀",
		'Make today count! 💫'
	];

	const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];

	const title = count === 1 ? '📝 1 habit waiting for you' : `📝 ${count} habits waiting for you`;

	const body = `${randomPhrase}\n\n${habitList}`;

	return {
		title,
		body,
		tag: 'habit-reminder',
		data: {
			type: 'reminder',
			habitCount: count,
			timestamp: new Date().toISOString()
		}
	};
}
