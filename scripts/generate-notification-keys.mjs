#!/usr/bin/env node
/**
 * Generate keys for notification system
 *
 * Generates:
 * 1. Encryption key for Ntfy URL storage (AES-256-GCM)
 * 2. VAPID keys for web push notifications
 */

import crypto from 'crypto';
import webPush from 'web-push';

console.log('='.repeat(60));
console.log('Trakit Notification Keys Generator');
console.log('='.repeat(60));
console.log('');

// Generate encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('1. Encryption Key (for NOTIFICATION_ENCRYPTION_KEY):');
console.log('');
console.log(encryptionKey);
console.log('');

// Generate VAPID keys
const vapidKeys = webPush.generateVAPIDKeys();
console.log('2. VAPID Keys (for web push notifications):');
console.log('');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key:');
console.log(vapidKeys.privateKey);
console.log('');

console.log('='.repeat(60));
console.log('📋 Copy these lines to your .env file:');
console.log('='.repeat(60));
console.log('');
console.log(`NOTIFICATION_ENCRYPTION_KEY=${encryptionKey}`);
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=noreply@yourdomain.com`);
console.log('');
console.log('Note: VAPID_PUBLIC_KEY is used server-side and passed to client via page data.');
console.log('');
console.log('='.repeat(60));
console.log('⚠️  Keep these keys secret and never commit them to git!');
console.log('='.repeat(60));
