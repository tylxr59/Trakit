/**
 * Encryption utilities for storing sensitive data
 *
 * Uses AES-256-GCM for encrypting Ntfy URLs with credentials
 */

import crypto from 'crypto';
import { env } from '$env/dynamic/private';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 * Must be a 32-byte (64 hex characters) string
 */
function getEncryptionKey(): Buffer | null {
	const key = env.NOTIFICATION_ENCRYPTION_KEY;

	if (!key) {
		logger.error('NOTIFICATION_ENCRYPTION_KEY not configured');
		return null;
	}

	if (key.length !== 64) {
		logger.error('NOTIFICATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
		return null;
	}

	try {
		return Buffer.from(key, 'hex');
	} catch (error) {
		logger.error('Invalid NOTIFICATION_ENCRYPTION_KEY format', {
			error: error instanceof Error ? error.message : String(error)
		});
		return null;
	}
}

/**
 * Encrypt Ntfy URL (which may contain credentials)
 *
 * @param plaintext - The Ntfy URL to encrypt
 * @returns Object with encrypted data and IV, or null on error
 */
export function encryptNtfyUrl(plaintext: string): {
	encrypted: string;
	iv: string;
} | null {
	try {
		const key = getEncryptionKey();
		if (!key) {
			return null;
		}

		// Generate random IV
		const iv = crypto.randomBytes(IV_LENGTH);

		// Create cipher
		const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

		// Encrypt
		let encrypted = cipher.update(plaintext, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		// Get auth tag
		const authTag = cipher.getAuthTag();

		// Combine encrypted data and auth tag
		const combined = encrypted + authTag.toString('hex');

		return {
			encrypted: combined,
			iv: iv.toString('hex')
		};
	} catch (error) {
		logger.error('Failed to encrypt Ntfy URL', {
			error: error instanceof Error ? error.message : String(error)
		});
		return null;
	}
}

/**
 * Decrypt Ntfy URL
 *
 * @param encryptedData - The encrypted URL (includes auth tag)
 * @param ivHex - The initialization vector as hex string
 * @returns Decrypted URL or null on error
 */
export function decryptNtfyUrl(encryptedData: string, ivHex: string): string | null {
	try {
		const key = getEncryptionKey();
		if (!key) {
			return null;
		}

		// Parse IV
		const iv = Buffer.from(ivHex, 'hex');

		// Split encrypted data and auth tag
		const authTagHex = encryptedData.slice(-AUTH_TAG_LENGTH * 2);
		const encryptedHex = encryptedData.slice(0, -AUTH_TAG_LENGTH * 2);

		const authTag = Buffer.from(authTagHex, 'hex');

		// Create decipher
		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);

		// Decrypt
		let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	} catch (error) {
		logger.error('Failed to decrypt Ntfy URL', {
			error: error instanceof Error ? error.message : String(error)
		});
		return null;
	}
}

/**
 * Generate a new encryption key (for setup)
 * Run this once to generate a key for NOTIFICATION_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
	return crypto.randomBytes(32).toString('hex');
}
