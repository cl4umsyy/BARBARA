# Phase 1 — Project Setup & Design System

Jalankan workflow inisialisasi proyek BARBARA E-Commerce. Baca `workflows/1_setup.md` sebagai sumber utama, lalu implementasikan setiap langkah secara berurutan.

## Dokumen acuan

- Rule: `.cursor/rules/design-system.mdc`
- Skill: `.cursor/skills/setup-design-system/SKILL.md` (baca `reference.md` untuk template kode)

## Tugas

1. Inisialisasi Next.js (TypeScript, Tailwind, App Router, `src/`, alias `@/*`) jika belum ada
2. Instal dependencies inti dan devDependencies sesuai workflow
3. Setup font Montserrat di `src/app/layout.tsx`
4. Konfigurasi Tailwind CSS 4 + monochrome tokens di `src/app/globals.css`
5. Buat komponen UI dasar: `Button`, `Input`, `Badge` di `src/components/ui/`

## Constraints

- Patuhi palet monochrome dan tipografi Montserrat dari design system rule
- Tombol: `rounded-none`, hover inversi hitam ⇄ putih
- Input: gaya underlined minimalis
- Ikuti panduan Next.js di `node_modules/next/dist/docs/` (bukan asumsi versi lama)

## Verifikasi (wajib dicek sebelum selesai)

- [ ] `npm run dev` berjalan tanpa error
- [ ] Font Montserrat ter-load di browser
- [ ] Hover button inversi warna smooth
- [ ] Input field memakai border-bottom saja

Laporkan progress dengan checklist di atas dan file yang dibuat/diubah.
