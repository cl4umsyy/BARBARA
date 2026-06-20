---
name: auth-implementation
description: Implements NextAuth.js v5 credentials/OAuth login, middleware route protection, and server session access for BARBARA E-Commerce. Use when setting up authentication, login/register pages, protecting /account or /admin routes, or securing API handlers with auth().
disable-model-invocation: true
---

# Authentication Implementation

Patuhi `.cursor/rules/auth.mdc` saat implementasi.

## Workflow

```
Task Progress:
- [ ] Buat src/lib/auth.ts (NextAuth v5 + Credentials + Google)
- [ ] Buat src/app/api/auth/[...nextauth]/route.ts
- [ ] Buat src/middleware.ts (proteksi /admin, /account, /auth)
- [ ] Extend types session (role, id) jika diperlukan
- [ ] Gunakan auth() di Server Components & API routes
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config, providers, JWT/session callbacks |
| `src/app/api/auth/[...nextauth]/route.ts` | Export GET/POST handlers |
| `src/middleware.ts` | Edge protection sebelum render halaman |

## Rules (Ringkas)

- Password: bcrypt/argon2 hash — tidak plaintext
- Session strategy: JWT (atau database + PrismaAdapter)
- `/admin/*`: login + `role === 'ADMIN'`
- `/account/*`, `/checkout`: wajib login
- `/auth/*`: redirect jika sudah login (admin → `/admin`, customer → `/`)
- API `/api/user/*`, `/api/cart/*`, `/api/orders/*`, `/api/admin/*`: validasi `auth()` → 401/403

## Server Session Pattern

```tsx
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth();
  if (!session?.user) return null; // atau redirect
  // ...
}
```

## Code Templates

Full implementations: [reference.md](reference.md)
