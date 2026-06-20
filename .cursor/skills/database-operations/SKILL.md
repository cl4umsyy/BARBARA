---
name: database-operations
description: Sets up Prisma singleton, PostgreSQL schema models, seed scripts, and safe CRUD patterns for BARBARA E-Commerce. Use when creating Prisma models, running migrations, seeding data, or writing database queries.
disable-model-invocation: true
---

# Database Operations

Patuhi `.cursor/rules/database.mdc` saat implementasi.

## Workflow

```
Task Progress:
- [ ] Pastikan src/lib/prisma.ts singleton ada
- [ ] Definisikan/update model di prisma/schema.prisma
- [ ] Jalankan npx prisma migrate dev (atau db push untuk prototipe)
- [ ] Buat/update prisma/seed.ts jika perlu data awal
- [ ] Daftarkan seed di package.json → npx prisma db seed
```

## Commands

```bash
npx prisma migrate dev --name <description>
npx prisma db push          # prototipe cepat
npx prisma db seed
npx prisma studio
```

## Naming Conventions

- Model: PascalCase singular (`ProductVariant`)
- Table: `@@map("product_variants")` snake_case plural
- Field: camelCase; kolom DB: `@map("color_hex")` jika perlu
- Harga: `Decimal @db.Decimal(12, 2)` — bukan Float
- `onDelete`: Cascade untuk child (images, variants, cart items); Restrict untuk historis (order items)

## Prisma Usage

- Import selalu dari `@/lib/prisma` (singleton)
- Hindari `$queryRaw` kecuali query terlalu kompleks
- Index FK, slug unik, dan filter kombinasi (`@@index([categoryId, isActive])`)

## Code Templates

Prisma singleton, schema contoh, dan seed script: [reference.md](reference.md)
