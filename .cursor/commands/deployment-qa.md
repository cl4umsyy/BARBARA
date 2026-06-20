# Phase 5 — QA Testing, SEO, & Deployment

Jalankan workflow QA dan deployment BARBARA. Baca `workflows/8_deployment_qa.md`, lalu selesaikan SEO, performa, dan deploy ke Vercel.

## Dokumen acuan

- Rules: `.cursor/rules/seo-performance.mdc`, `.cursor/rules/payment.mdc`
- Skill: `.cursor/skills/payment-integration/SKILL.md`
- Detail: `workflows/7_webhook_verification.md`

## Tugas

1. **Webhook lokal** — uji via Ngrok (rujuk `/webhook-verification` command jika belum)
2. **SEO** — `generateMetadata` di `/shop/[slug]`, JSON-LD Product schema, BreadcrumbList
3. **Sitemap & robots** — `src/app/sitemap.ts` (static + product slugs), `src/app/robots.ts` (block cart/checkout/account/admin)
4. **Performa** — ganti `<img>` → `next/image`, `priority` pada hero & main product image, ISR `revalidate: 3600` untuk shop
5. **Deploy Vercel** — env vars dari PRD, `postinstall: prisma generate`, trigger production build

## Build check

```bash
npm run build
```

## Verifikasi

- [ ] Webhook Ngrok sukses update status order
- [ ] `sitemap.xml` dan `robots.txt` accessible di production
- [ ] Lighthouse SEO & Best Practices > 90
- [ ] Sandbox Midtrans transaksi tercatat akurat di DB production

Laporkan checklist QA, skor Lighthouse jika diuji, dan status deployment Vercel.
