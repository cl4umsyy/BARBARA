import { z } from "zod";

export const productVariantSchema = z.object({
  size: z.enum(["M", "L", "XL"], {
    message: "Ukuran harus M, L, atau XL",
  }),
  color: z.string().min(1, { message: "Warna wajib diisi" }),
  colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, { message: "Format hex warna tidak valid (contoh: #FFFFFF)" }),
  stock: z.number({ message: "Stok wajib diisi" }).int({ message: "Stok harus bilangan bulat" }).nonnegative({ message: "Stok tidak boleh negatif" }),
  sku: z.string().min(3, { message: "SKU minimal 3 karakter" }),
});

export const productSchema = z.object({
  name: z.string().min(3, { message: "Nama produk minimal 3 karakter" }),
  description: z.string().min(10, { message: "Deskripsi minimal 10 karakter" }),
  categoryId: z.string().min(1, { message: "Kategori wajib dipilih" }),
  collection: z.enum([
    "NEW_ARRIVALS",
    "BEST_SELLERS",
    "GRAPHIC_TEES",
    "OVERSIZED_COLLECTION",
    "ESSENTIALS",
    "LIMITED_EDITION"
  ]).optional().nullable(),
  price: z.number({ message: "Harga wajib diisi" }).positive({ message: "Harga harus bernilai positif dan lebih besar dari 0" }),
  material: z.string().optional().nullable(),
  care: z.string().optional().nullable(),
  variants: z.array(productVariantSchema).min(1, { message: "Minimal harus ada 1 varian produk" }),
  images: z
    .array(
      z.string().refine(
        (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
        { message: "Format URL gambar tidak valid" }
      )
    )
    .min(1, { message: "Minimal harus mengunggah 1 gambar" }),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
