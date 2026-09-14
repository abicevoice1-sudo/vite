# Shiarishta — Vite + React 19

Nikah-first matchmaking. Verified, privacy-protected, wali-supported.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static output in dist/
npm run preview
```

Admin accounts: set `VITE_ADMIN_EMAILS="you@example.com"` in `.env`, register
that email once, then sign in at `/admin/login`.

## Architecture

- `src/routes.jsx` — flat public routes + `RequireAuth` / `RequireAdmin` gates.
- `src/lib/api/client.js` — the ONLY data import pages use. Includes SWR hooks.
- `src/lib/api/repository.js` — typed CRUD over storage. No latency, no random.
- `src/lib/api/storage.js` — the ONLY localStorage touchpoint (swap for HTTP).
- `src/lib/api/authService.js` — bcrypt-hashed passwords, `{ uid, email, displayName, isAdmin }` sessions.
- `src/lib/auth/AuthContext.jsx` — global session provider.
- `src/layouts/Guards.jsx` — `RequireAuth`, `RequireAdmin` route gates.
- `src/lib/compatibility.js` — pure compatibility scoring (no side effects).

To point at a real server: implement `storage.js` + `repository.js` with `fetch`
against your API. Zero call-site changes — the facade contract stays identical.
