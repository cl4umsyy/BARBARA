# 🛠️ Skills: Database Operations (BARBARA E-Commerce)

Panduan ini berisi langkah-langkah implementasi koneksi database PostgreSQL, pembuatan model skema di Prisma, seeding data, dan penulisan query CRUD yang aman.

---

## 1. Prisma Client Singleton (`src/lib/prisma.ts`)
Selalu impor instance database dari file singleton ini di seluruh rute server Next.js Anda agar tidak terjadi error kebocoran memori (memory leak) saat reload module.

### Implementasi:
```typescript
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
```

---

## 2. Struktur Skema Prisma Utama (`prisma/schema.prisma`)
Setiap kali memperbarui model, jalankan `npx prisma db push` atau `npx prisma migrate dev`.

### Contoh Model Inti E-Commerce:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model User {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  password  String
  role      Role      @default(CUSTOMER)
  createdAt DateTime  @default(now())
  addresses Address[]
  orders    Order[]
  wishlists Wishlist[]
  cart      Cart?

  @@map("users")
}

model Product {
  id          String           @id @default(cuid())
  name        String
  slug        String           @unique
  description String
  price       Decimal          @db.Decimal(12, 2)
  material    String?
  care        String?
  isNew       Boolean          @default(true)
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  categoryId  String
  category    Category         @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  images      ProductImage[]
  variants    ProductVariant[]
  wishlists   Wishlist[]

  @@index([categoryId, isActive])
  @@map("products")
}

model ProductVariant {
  id        String      @id @default(cuid())
  productId String
  product   Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  size      String      // M, L, XL
  color     String
  colorHex  String      // Contoh: #000000
  stock     Int         @default(0)
  sku       String      @unique
  cartItems CartItem[]
  orderItems OrderItem[]

  @@map("product_variants")
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  image       String?
  description String?
  products    Product[]

  @@map("categories")
}
```

---

## 3. Menulis Seeder Data (`prisma/seed.ts`)
Gunakan script seeding untuk menyiapkan data default kategori dan produk awal BARBARA.

### Implementasi:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "users", "categories", "products", "product_variants" CASCADE;`);

  // Create Categories
  const topsCategory = await prisma.category.create({
    data: {
      name: 'Tops',
      slug: 'tops',
      description: 'Atasan Unisex BARBARA',
    },
  });

  // Create Product
  const product = await prisma.product.create({
    data: {
      name: 'BARBARA Oversized Noir Tee',
      slug: 'barbara-oversized-noir-tee',
      description: 'Kaos oversized katun premium berwarna hitam dengan detail visual yang bold.',
      price: 299000,
      material: '100% Heavyweight Cotton 24s',
      care: 'Cuci dengan air dingin, jangan disetrika pada bagian print.',
      categoryId: topsCategory.id,
      variants: {
        create: [
          { size: 'M', color: 'Black', colorHex: '#000000', stock: 15, sku: 'BBR-TEE-BLK-M' },
          { size: 'L', color: 'Black', colorHex: '#000000', stock: 20, sku: 'BBR-TEE-BLK-L' },
          { size: 'XL', color: 'Black', colorHex: '#000000', stock: 10, sku: 'BBR-TEE-BLK-XL' },
        ]
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', alt: 'Front view', order: 0 }
        ]
      }
    },
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
*Jalankan seed dengan mendaftarkan script di `package.json` pada field `"prisma": { "seed": "ts-node prisma/seed.ts" }` lalu jalankan command `npx prisma db seed`.*
