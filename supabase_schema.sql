-- =============================================================================
-- DATABASE SCHEMA & RLS POLICIES FOR BARBARA E-COMMERCE (SUPABASE)
-- =============================================================================

-- 1. Drop existing policies/functions/tables if they exist (Clean Slate)
DROP FUNCTION IF EXISTS public.is_admin CASCADE;

-- 2. Custom Types (Enums)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    CREATE TYPE "OrderStatus" AS ENUM (
      'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 
      'COMPLETED', 'CANCELLED', 'EXPIRED', 'FAILED'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');
  END IF;
END$$;

-- 3. Tables Definition
-- Users Table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Addresses Table (Billing/Shipping templates saved by User)
CREATE TABLE IF NOT EXISTS "addresses" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "recipient_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "postal_code" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Categories Table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "image" TEXT,
  "description" TEXT
);

-- Products Table
CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT NOT NULL,
  "price" DECIMAL(12, 2) NOT NULL,
  "material" TEXT,
  "care" TEXT,
  "is_new" BOOLEAN NOT NULL DEFAULT TRUE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "category_id" TEXT NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT
);

-- Product Images Table
CREATE TABLE IF NOT EXISTS "product_images" (
  "id" TEXT PRIMARY KEY,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Product Variants Table (Sizes & Stock inventory)
CREATE TABLE IF NOT EXISTS "product_variants" (
  "id" TEXT PRIMARY KEY,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "color_hex" TEXT NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "sku" TEXT UNIQUE NOT NULL
);

-- Carts Table
CREATE TABLE IF NOT EXISTS "carts" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" TEXT PRIMARY KEY,
  "cart_id" TEXT NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
  "variant_id" TEXT NOT NULL REFERENCES "product_variants"("id") ON DELETE RESTRICT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  UNIQUE("cart_id", "variant_id")
);

-- Wishlists Table
CREATE TABLE IF NOT EXISTS "wishlists" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE("user_id", "product_id")
);

-- Orders Table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "order_number" TEXT UNIQUE NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "subtotal" DECIMAL(12, 2) NOT NULL,
  "shipping_cost" DECIMAL(12, 2) NOT NULL,
  "total" DECIMAL(12, 2) NOT NULL,
  "payment_method" TEXT,
  "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "midtrans_id" TEXT,
  "midtrans_transaction_id" TEXT,
  "payment_type" TEXT,
  "transaction_status" TEXT,
  "fraud_status" TEXT,
  "settlement_time" TEXT,
  "paid_at" TIMESTAMP WITH TIME ZONE,
  "shipping_method" TEXT,
  "tracking_number" TEXT,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT PRIMARY KEY,
  "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "variant_id" TEXT NOT NULL REFERENCES "product_variants"("id") ON DELETE RESTRICT,
  "product_name" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DECIMAL(12, 2) NOT NULL
);

-- Shipping Addresses Table (Destination for a completed checkout)
CREATE TABLE IF NOT EXISTS "shipping_addresses" (
  "id" TEXT PRIMARY KEY,
  "order_id" TEXT UNIQUE NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "recipient_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "postal_code" TEXT NOT NULL
);

-- 4. Database Indices (Performance Optimizations)
CREATE INDEX IF NOT EXISTS "idx_addresses_user" ON "addresses"("user_id");
CREATE INDEX IF NOT EXISTS "idx_products_category_active" ON "products"("category_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_product_images_product" ON "product_images"("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_variants_product" ON "product_variants"("product_id");
CREATE INDEX IF NOT EXISTS "idx_cart_items_cart" ON "cart_items"("cart_id");
CREATE INDEX IF NOT EXISTS "idx_cart_items_variant" ON "cart_items"("variant_id");
CREATE INDEX IF NOT EXISTS "idx_wishlists_user" ON "wishlists"("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_user" ON "orders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_payment_status" ON "orders"("payment_status");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "order_items"("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_variant" ON "order_items"("variant_id");

-- 5. Enable Row Level Security (RLS)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipping_addresses" ENABLE ROW LEVEL SECURITY;

-- 6. Helper Security Function to Identify Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Granular RLS Policies

-- Users Policies
CREATE POLICY "Allow public inserts on users (Registration)" ON "users" FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow select on users for own data or admin" ON "users" FOR SELECT USING (auth.uid()::text = id OR public.is_admin());
CREATE POLICY "Allow update on users for own data or admin" ON "users" FOR UPDATE USING (auth.uid()::text = id OR public.is_admin());
CREATE POLICY "Allow delete on users for admin only" ON "users" FOR DELETE USING (public.is_admin());

-- Addresses Policies
CREATE POLICY "Allow select on addresses for own data or admin" ON "addresses" FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow insert on addresses for own data or admin" ON "addresses" FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow update on addresses for own data or admin" ON "addresses" FOR UPDATE USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow delete on addresses for own data or admin" ON "addresses" FOR DELETE USING (auth.uid()::text = user_id OR public.is_admin());

-- Catalog Tables Policies (Public Read, Admin Write)
CREATE POLICY "Allow public select on categories" ON "categories" FOR SELECT USING (TRUE);
CREATE POLICY "Allow admin manage on categories" ON "categories" FOR ALL USING (public.is_admin());

CREATE POLICY "Allow public select on products" ON "products" FOR SELECT USING (TRUE);
CREATE POLICY "Allow admin manage on products" ON "products" FOR ALL USING (public.is_admin());

CREATE POLICY "Allow public select on product_images" ON "product_images" FOR SELECT USING (TRUE);
CREATE POLICY "Allow admin manage on product_images" ON "product_images" FOR ALL USING (public.is_admin());

CREATE POLICY "Allow public select on product_variants" ON "product_variants" FOR SELECT USING (TRUE);
CREATE POLICY "Allow admin manage on product_variants" ON "product_variants" FOR ALL USING (public.is_admin());

-- Carts Policies
CREATE POLICY "Allow select on carts for own data or admin" ON "carts" FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow insert on carts for own data or admin" ON "carts" FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow update on carts for own data or admin" ON "carts" FOR UPDATE USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow delete on carts for own data or admin" ON "carts" FOR DELETE USING (auth.uid()::text = user_id OR public.is_admin());

-- Cart Items Policies
CREATE POLICY "Allow select on cart_items for own cart or admin" ON "cart_items" FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow insert on cart_items for own cart or admin" ON "cart_items" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow update on cart_items for own cart or admin" ON "cart_items" FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow delete on cart_items for own cart or admin" ON "cart_items" FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND (user_id = auth.uid()::text OR public.is_admin()))
);

-- Wishlists Policies
CREATE POLICY "Allow select on wishlists for own data or admin" ON "wishlists" FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow insert on wishlists for own data or admin" ON "wishlists" FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow delete on wishlists for own data or admin" ON "wishlists" FOR DELETE USING (auth.uid()::text = user_id OR public.is_admin());

-- Orders Policies
CREATE POLICY "Allow select on orders for own data or admin" ON "orders" FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow insert on orders for own data or admin" ON "orders" FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow update on orders for own data or admin" ON "orders" FOR UPDATE USING (auth.uid()::text = user_id OR public.is_admin());
CREATE POLICY "Allow delete on orders for admin only" ON "orders" FOR DELETE USING (public.is_admin());

-- Order Items Policies
CREATE POLICY "Allow select on order_items for own order or admin" ON "order_items" FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow insert on order_items for own order or admin" ON "order_items" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow update on order_items for admin only" ON "order_items" FOR UPDATE USING (public.is_admin());
CREATE POLICY "Allow delete on order_items for admin only" ON "order_items" FOR DELETE USING (public.is_admin());

-- Shipping Addresses Policies
CREATE POLICY "Allow select on shipping_addresses for own order or admin" ON "shipping_addresses" FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow insert on shipping_addresses for own order or admin" ON "shipping_addresses" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow update on shipping_addresses for own order or admin" ON "shipping_addresses" FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid()::text OR public.is_admin()))
);
CREATE POLICY "Allow delete on shipping_addresses for admin only" ON "shipping_addresses" FOR DELETE USING (public.is_admin());
