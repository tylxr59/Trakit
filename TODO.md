# TODO - Trakit Development Tasks

This document tracks outstanding tasks, technical debt, and implementation notes for the Trakit habit tracker.

## Active Development

### Reminder Notification Feature (✅ Completed - 2026-02-05)

**Implementation Decisions:**

- ✅ Using node-cron for scheduling with a SQLite delivery ledger to prevent duplicate reminders
- ✅ Encrypt Ntfy credentials with app secret (crypto module with AES-256-GCM)
- ✅ Daily reminders at user-specified time in their timezone
- ✅ Single motivational notification listing all incomplete habits
- ✅ Timezone-aware scheduling using user's timezone preference

**Status:** Feature complete and tested

**Completed Features:**

- Database migration with notification preference columns
- Push notification support via PWA (VAPID keys)
- Ntfy integration with encrypted credential storage
- Timezone-aware cron scheduler (runs every minute)
- Settings UI with service selection and test functionality
- API endpoints for subscription, preferences, and testing
- Motivational messages with random encouraging phrases
- Service worker with push event handlers
- Automatic expired subscription cleanup

**Documentation:**

- See [NOTIFICATIONS.md](NOTIFICATIONS.md) for full documentation
- Setup instructions in `.env.example`
- Key generation script: `npm run generate:notification-keys`

**Known Limitations (MVP):**

- No retry mechanism for failed notifications
- Delivery tracking is limited to duplicate prevention, not confirmation
- Service worker TypeScript not in tsconfig (intentional, handled by Vite PWA)

**Production Improvements Needed:**

- Consider a dedicated job queue if reminder volume grows beyond a single app container
- Add monitoring for notification delivery rates
- Add automated tests for encryption, scheduler, and notification delivery
- Add health check endpoint for scheduler status

## Technical Debt

### Logging Infrastructure

- **Priority:** Medium
- **Description:** Currently using console-based logging (see `src/lib/server/logger.ts`)
- **TODO:** Implement proper logging service for production (Winston, Pino, or external service like Datadog)
- **Impact:** Makes debugging production issues difficult

### Session Storage

- **Priority:** Low
- **Description:** Sessions stored in SQLite; could benefit from Redis for high-concurrency deployments
- **TODO:** Evaluate Redis session store if performance becomes issue
- **Impact:** Minimal for current scale

## Future Enhancements

### Habit Features

- [ ] Habit templates/presets for quick setup
- [ ] Habit categories/tags for organization
- [ ] Notes/journal entries per habit completion
- [ ] Habit archiving (soft delete)
- [ ] Export habit data (CSV, JSON)

### Analytics

- [ ] Completion rate trends over time
- [ ] Habit insights (best/worst days, streaks analysis)
- [ ] Weekly/monthly summary reports

### Social Features

- [ ] Share habits with accountability partners
- [ ] Public habit profiles (optional)
- [ ] Community challenges

### Notification Enhancements (Post-MVP)

- [ ] Per-habit reminder configuration
- [ ] Multiple reminder times per day
- [ ] Frequency-aware reminders (respect daily/weekly/monthly habits)
- [ ] Reminder snooze functionality
- [ ] Custom notification messages
- [ ] Email reminder option
- [ ] SMS reminder option (Twilio integration)

### Infrastructure

- [ ] Health check endpoint for monitoring
- [ ] Metrics/observability (Prometheus, Grafana)
- [ ] Database backup automation
- [ ] SQLite backup/restore documentation

## Notes for Future Agents

When making changes to the codebase:

1. **Update this file** if you introduce technical debt or deferring decisions
2. **Document implementation choices** that future developers should know
3. **Track "TODO" comments** in code by adding them here with file references
4. **Note production considerations** if MVP implementation has scale limitations
5. **After completing work**, run: `npm run check && npm run lint && npm run format && npm test`

---

**Last Updated:** 2026-06-29
