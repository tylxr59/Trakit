# AGENTS.md - AI Agent Guide for Trakit

## What is Trakit?

A self-hosted habit tracker with GitHub-style calendar visualization. Built with **SvelteKit 2.14 (Svelte 5)**, **TypeScript**, and **PostgreSQL**.

## Tech Stack Essentials

- **Frontend**: SvelteKit + Svelte 5 (uses runes: `$state`, `$derived`, `$props`)
- **Backend**: SvelteKit API routes + custom session auth (CSRF protected)
- **Database**: PostgreSQL 16+ with `node-pg-migrate`
- **Styling**: Tailwind CSS 4.1 with Material 3 design tokens
- **Auth**: Custom session management (replaced Lucia v3) using `@oslojs/crypto`

## Project Structure

```
src/
├── lib/
│   ├── components/         # Svelte components (CalendarGrid, HabitCard, etc.)
│   ├── server/            # Server-only code (db, sessions, validation)
│   └── stores/            # Client state (theme, swr)
├── routes/                # SvelteKit file-based routing
│   ├── +page.svelte       # Dashboard UI
│   ├── +page.server.ts    # Dashboard data loading + actions
│   ├── api/               # API endpoints (/api/habit, /api/stamp, etc.)
│   ├── habit/[id]/        # Individual habit detail page
│   └── login|signup|settings/
└── hooks.server.ts        # Session validation on every request

migrations/                # Database schema migrations
```

## Key Concepts

### Database Schema
- **users**: email, password_hash (Argon2), timezone, email_verified
- **sessions**: id (SHA-256 hash), user_id, expires_at, csrf_token
- **habits**: name, color, frequency (daily/weekly/monthly), sort_order
- **habit_stamps**: habit_id, day (date), value (0 or 1)

### Authentication Flow
1. Session tokens are 20-byte random values (base32 encoded)
2. Session ID stored in DB is SHA-256 hash of token
3. Two cookies: `auth_session` (HttpOnly) + `csrf_token` (readable by JS)
4. Sessions auto-refresh if < 15 days remaining (30-day total)
5. Validated on every request via `hooks.server.ts`

### SvelteKit Routing Conventions
- `+page.svelte` = UI component
- `+page.server.ts` = Server load function + form actions
- `+server.ts` = API endpoint (GET, POST, PATCH, DELETE)
- `+layout.svelte` / `+layout.server.ts` = Shared layouts

### Habit Tracking
- **Streaks**: Calculated in `src/lib/server/habitUtils.ts`
  - Daily: consecutive days (allows today or yesterday as start)
  - Weekly: consecutive weeks with ≥1 completion
  - Monthly: consecutive months with ≥1 completion
- **Calendar**: GitHub-style heat map (26 weeks, 182 days) in `CalendarGrid.svelte`

## Common Tasks

### Adding a New Habit Property
1. Create migration: `npm run migrate:create add-property-name`
2. Update `Habit` interface in `src/lib/server/db.ts`
3. Add validation in `src/lib/server/validation.ts`
4. Update API handler in `src/routes/api/habit/+server.ts`
5. Update UI components

### Adding a New Route
1. Create `src/routes/<path>/+page.svelte` (UI)
2. Create `src/routes/<path>/+page.server.ts` (data loading)
3. Add auth check: `if (!locals.user) throw redirect(302, '/login');`

### Modifying Theme
Edit `src/app.css` - Material 3 tokens are CSS custom properties

## Development Commands

```bash
npm run dev              # Start dev server
npm run migrate:up       # Apply migrations
npm run lint             # ESLint + Prettier
npm run check            # TypeScript + Svelte check
npm test                 # Run Vitest tests
```

## Important Patterns

**Svelte 5 Runes:**
```typescript
let count = $state(0);              // Reactive state
let doubled = $derived(count * 2);  // Computed value
let { prop } = $props();            // Component props
```

**Form Actions:**
```typescript
export const actions = {
  actionName: async ({ locals, request }) => {
    const data = await request.formData();
    // Process...
    return { success: true };
  }
};
```

**API Endpoints:**
```typescript
export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  const body = await request.json();
  // Process...
  return json({ success: true });
};
```

## Security Notes

- All state-changing requests validate CSRF token
- Passwords hashed with Argon2
- SQL queries use parameterized statements (no injection)
- Rate limiting on auth endpoints
- All habit operations verify user ownership

---

**For more details**: See README.md or explore the codebase  
**Repository**: https://github.com/tylxr59/Trakit
