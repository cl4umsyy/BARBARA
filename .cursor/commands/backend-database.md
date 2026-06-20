# Phase 2 — Database & Backend Implementation

Jalankan workflow backend BARBARA. Baca `workflows/2_backend_database.md`, lalu implementasikan database, seed, dan auth secara berurutan.

## Dokumen acuan

- Rules: `.cursor/rules/database.mdc`, `.cursor/rules/auth.mdc`
- Skills: `.cursor/skills/database-operations/`, `.cursor/skills/auth-implementation/`
- Detail: `workflows/1-2_database_schema.md`, `workflows/1-3_auth_setup.md`

## Tugas

1. `npx prisma init` + `DATABASE_URL` di `.env.local`
2. Definisikan `prisma/schema.prisma` (rujuk detail database schema)
3. Buat `src/lib/prisma.ts` singleton
4. Buat `prisma/seed.ts` + daftarkan di `package.json` → `npx prisma db seed`
5. Setup NextAuth: `src/lib/auth.ts`, API route, middleware, type extensions

## Commands

```bash
npx prisma db push
npx prisma db seed
npx prisma studio
```

## Verifikasi

- [ ] PostgreSQL terhubung, migrate/push sukses
- [ ] Seed data kategori & produk sample ada di DB
- [ ] `/admin` redirect non-login ke `/auth/login`
- [ ] `/api/auth/session` mengembalikan `role` setelah login

Laporkan progress dengan checklist dan langkah yang masih pending.
