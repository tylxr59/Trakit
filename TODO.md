# TODO - Trakit Development Tasks

This document tracks outstanding tasks, technical debt, and implementation notes for the Trakit habit tracker.

## Active Development

No active implementation task is in progress.

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

### Build Tooling

- **Priority:** Low
- **Description:** Production builds currently pass, but `vite-plugin-pwa` emits a deprecation warning for `inlineDynamicImports`
- **TODO:** Revisit PWA plugin configuration during the next dependency maintenance pass
- **Impact:** No runtime impact observed; this is dependency drift to monitor

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

- [ ] Retry failed notification deliveries
- [ ] Add notification delivery monitoring
- [ ] Add automated tests for encryption, scheduler, and notification delivery
- [ ] Add health check endpoint for scheduler status
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
