# Detail — NextAuth.js v5 Configuration

Jalankan workflow autentikasi BARBARA. Baca `workflows/1-3_auth_setup.md`, lalu implementasikan NextAuth v5 end-to-end.

## Dokumen acuan

- Rule: `.cursor/rules/auth.mdc`
- Skill: `.cursor/skills/auth-implementation/SKILL.md` (baca `reference.md` untuk template)

## Tugas

1. Buat `src/lib/auth.ts` — Credentials (bcrypt) + Google OAuth, JWT callbacks (role, id)
2. Buat `src/app/api/auth/[...nextauth]/route.ts` — export GET/POST handlers
3. Buat `src/middleware.ts` — proteksi `/admin/*`, `/account/*`, `/auth/*`
4. Buat `src/types/next-auth.d.ts` — extend Session/User/JWT dengan `role` dan `id`
5. Pastikan `tsconfig.json` include file type definitions

## Constraints

- Password wajib di-hash (bcrypt/argon2)
- `/admin/*`: hanya `role === 'ADMIN'`
- `/account/*`, `/checkout`: wajib login
- `/auth/*`: redirect jika session aktif
- API protected routes: 401/403 sesuai rule auth

## Verifikasi

- [ ] Login credentials berfungsi
- [ ] Session berisi `user.role` dan `user.id`
- [ ] `/admin` redirect non-login ke `/auth/login`
- [ ] Non-admin tidak bisa akses `/admin/*`

Laporkan file yang dibuat dan hasil uji proteksi route.
