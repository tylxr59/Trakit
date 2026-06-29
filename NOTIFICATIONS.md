# Trakit Notifications

Trakit supports daily habit reminders through two delivery services:

- **Web Push**: Browser/PWA push notifications using VAPID keys
- **Ntfy**: Self-hosted Ntfy topics with encrypted URL storage

Reminder configuration lives in the Settings page. Users choose a reminder time,
timezone, and delivery service. The server-side scheduler checks every minute and
sends one motivational message listing incomplete habits for that user's current
day.

## Environment Setup

Notification support is optional. To enable it, generate notification keys:

```bash
npm run generate:notification-keys
```

Copy the generated values into `.env`:

```env
NOTIFICATION_ENCRYPTION_KEY=your-64-character-hex-encryption-key
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=noreply@yourdomain.com
```

Restart the app after changing these values.

`NOTIFICATION_ENCRYPTION_KEY` is required for Ntfy URL encryption.
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_EMAIL` are required for Web
Push notifications.

## Web Push and VAPID

VAPID identifies this Trakit instance to browser push services and signs outgoing
push requests.

- The key generator uses `web-push` to create the VAPID public/private key pair.
- The server configures `web-push` with `VAPID_EMAIL`, `VAPID_PUBLIC_KEY`, and
  `VAPID_PRIVATE_KEY` in `src/lib/server/notifications.ts`.
- The Settings page receives only `VAPID_PUBLIC_KEY` from
  `src/routes/settings/+page.server.ts`.
- The browser uses that public key in `PushManager.subscribe()`.
- The generated browser subscription is sent to `/api/notifications/subscribe`
  and stored in `users.push_subscription`.
- Scheduled reminders and test notifications use that stored subscription with
  `webPush.sendNotification()`.

Keep `VAPID_PRIVATE_KEY` secret. The public key is safe to expose to the browser.

### User Flow

1. User opens Settings.
2. User enables daily reminders.
3. User grants browser notification permission.
4. Browser subscribes with the VAPID public key.
5. Trakit stores the resulting push subscription for that user.
6. User saves the reminder service as Push.
7. Scheduler sends reminders through Web Push at the configured local time.

If the browser push service returns `404` or `410`, Trakit treats the subscription
as expired or invalid and clears `users.push_subscription`.

## Ntfy

Ntfy is an alternative delivery service for users who prefer a self-hosted push
topic.

Accepted Ntfy URL examples:

```text
https://ntfy.sh/my-topic
https://user:pass@ntfy.example.com/my-topic
```

When a user saves an Ntfy URL:

- The API validates that it is an HTTP or HTTPS URL with a topic path.
- The URL is encrypted with AES-256-GCM using `NOTIFICATION_ENCRYPTION_KEY`.
- The encrypted value and IV are stored in `users.ntfy_url_encrypted` and
  `users.ntfy_encryption_iv`.
- Delivery decrypts the URL immediately before posting to Ntfy.
- Basic-auth credentials embedded in the URL are moved to an `Authorization`
  header before sending.

The Settings page can reveal the stored Ntfy URL for the current user through
`/api/notifications/ntfy-url`.

## Scheduler Behavior

The scheduler is implemented in `src/lib/server/scheduler.ts`.

- Runs every minute with `node-cron`.
- Loads users where reminders are enabled, a service is selected, and a reminder
  time exists.
- Compares the current time in each user's timezone to their configured
  `HH:MM` reminder time.
- Uses `reminder_deliveries` as a delivery ledger so a user receives only one
  reminder per date and reminder time.
- Deletes reminder delivery rows older than 60 days.

For each matching user, Trakit checks today's habits in that user's timezone and
sends one message:

- If habits are incomplete, the message lists those habits.
- If all habits are complete, the message is a congratulatory notification.

The current reminder logic checks whether each habit was completed today. Weekly
and monthly habits are still treated as incomplete if they were not completed on
the current day.

## API Endpoints

- `POST /api/notifications/subscribe`: stores a browser push subscription for
  the signed-in user.
- `PATCH /api/notifications/preferences`: saves reminder enabled state, service,
  reminder time, and Ntfy URL if applicable.
- `POST /api/notifications/test`: sends a test notification through the user's
  configured service.
- `GET /api/notifications/ntfy-url`: returns the decrypted Ntfy URL for the
  signed-in user.

State-changing endpoints require an authenticated user and a valid CSRF header.

## Service Worker

`src/service-worker.ts` handles browser push events.

The push payload is expected to be JSON with:

```json
{
	"title": "Notification title",
	"body": "Notification body",
	"icon": "/icon-192.png",
	"badge": "/icon-192.png",
	"tag": "habit-reminder",
	"data": {}
}
```

The service worker displays the notification with
`self.registration.showNotification()`. Clicking the notification focuses an
existing Trakit window or opens `/`.

## Testing

After setting up environment variables and restarting the app:

1. Sign in.
2. Go to Settings.
3. Enable daily reminders.
4. Choose Push or Ntfy.
5. Save notification preferences.
6. Click **Send Test Notification**.

For Web Push, test in a browser that supports service workers and push
notifications. Local development usually requires `localhost` or HTTPS.

For Ntfy, confirm the configured topic receives a POST from the Trakit server.

## Troubleshooting

### Push notifications not configured

Check that all three VAPID variables are set:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=...
```

Restart the app after setting them.

### Browser permission denied

The browser controls notification permission. Reset the site's permission in
browser settings, reload Trakit, and enable Push again.

### No push subscription found

The user selected Push before the browser subscription was stored. In Settings,
grant notification permission and enable Push again.

### Push subscription expired

Trakit clears expired push subscriptions automatically. The user must re-enable
Push notifications in Settings.

### Ntfy encryption errors

Check `NOTIFICATION_ENCRYPTION_KEY`. It must be a 64-character hex string
representing 32 bytes.

### Reminder did not send

Check:

- The user has reminders enabled.
- The user has selected Push or Ntfy.
- `reminder_time` is in `HH:MM` format.
- The user's timezone is valid.
- The scheduler has started in server logs.
- For Push, the stored subscription is still valid.
- For Ntfy, the encrypted URL can be decrypted and the Ntfy endpoint is reachable.

## Current Limitations

- No retry mechanism for failed notification deliveries.
- Delivery tracking prevents duplicate reminders but does not confirm receipt.
- Reminder checks are simple daily checks, even for weekly and monthly habits.
- No per-habit reminder times.
- No delivery metrics or scheduler health endpoint yet.
