import dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Role, Collection, ProductGender } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Categories: Exactly 3 ONLY
const categoriesData = [
  { name: "Tops", slug: "tops", description: "Koleksi atasan BARBARA: Kaos, Kemeja, Polo, Henley." },
  { name: "Bottom", slug: "bottom", description: "Koleksi bawahan BARBARA: Celana jeans, cargo, chino, shorts." },
  { name: "Outerwear", slug: "outerwear", description: "Koleksi luaran BARBARA: Hoodie, Jaket, Bomber, Varsity, Parka." },
];

// Color palette mapping
const COLOR_MAP: Record<string, { hex: string; code: string }> = {
  "Hitam": { hex: "#000000", code: "BLK" },
  "Putih": { hex: "#FFFFFF", code: "WHT" },
  "Abu-Abu": { hex: "#808080", code: "GRY" },
  "Navy": { hex: "#0A192F", code: "NVY" },
  "Biru": { hex: "#1E40AF", code: "BLU" },
  "Coklat": { hex: "#5C3A21", code: "BRN" },
  "Beige": { hex: "#F5F5DC", code: "BGE" },
  "Cream": { hex: "#FFFDD0", code: "CRM" },
  "Hijau Army": { hex: "#4B5320", code: "ARM" },
  "Hijau Olive": { hex: "#556B2F", code: "OLV" },
  "Merah": { hex: "#DC2626", code: "RED" },
  "Maroon": { hex: "#800000", code: "MRN" },
  "Kuning": { hex: "#EAB308", code: "YEL" },
  "Mustard": { hex: "#D97706", code: "MST" },
  "Pink": { hex: "#EC4899", code: "PNK" },
  "Ungu": { hex: "#8B5CF6", code: "PUR" },
  "Orange": { hex: "#F97316", code: "ORG" },
  "Denim": { hex: "#3B82F6", code: "DNM" },
  "Khaki": { hex: "#C2B280", code: "KHK" },
};

// 42 Detailed Products across Tops (15), Bottom (14), Outerwear (13)
const productsData = [
  // ==================== TOPS (15 Products: Rp99.000 – Rp299.000) ====================
  {
    name: "BARBARA Minimalist Basic Tee",
    slug: "barbara-minimalist-basic-tee",
    description: "Kaos polos basic dari bahan katun murni berkualitas tinggi. Dipotong dengan siluet relaxed fit yang memberikan kenyamanan maksimal untuk pemakaian sehari-hari.",
    price: 99000,
    material: "100% Premium Combed Cotton 30s",
    care: "Cuci dengan air dingin, jangan gunakan pemutih, setrika suhu hangat.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Hitam", "Putih"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800", alt: "Basic Tee Front", order: 0 },
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", alt: "Basic Tee Detail", order: 1 }
    ]
  },
  {
    name: "BARBARA Vintage Graphic Tee",
    slug: "barbara-vintage-graphic-tee",
    description: "Kaos berdesain artwork grafis vintage bertema street culture. Menggunakan teknik cetak washed plastisol yang tahan lama dan tidak mudah retak.",
    price: 129000,
    material: "100% Cotton 24s Washed",
    care: "Cuci terbalik, hindari menyetrika langsung pada bagian cetakan grafis.",
    categorySlug: "tops",
    collection: Collection.GRAPHIC_TEES,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Abu-Abu", "Hitam"],
    sizes: ["M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800", alt: "Graphic Tee Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Oversized Boxy Tee",
    slug: "barbara-oversized-boxy-tee",
    description: "Kaos potongan oversized boxy fit dengan bahu turun (drop shoulder). Bahan kain berbobot mantap namun tetap sejuk dipakai sepanjang hari.",
    price: 149000,
    material: "100% Heavyweight Cotton 20s",
    care: "Cuci dengan mesin putaran lembut. Jemur gantung di tempat teduh.",
    categorySlug: "tops",
    collection: Collection.OVERSIZED_COLLECTION,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Cream", "Beige"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800", alt: "Oversized Tee Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Tactical Pocket Tee",
    slug: "barbara-tactical-pocket-tee",
    description: "Kaos kasual dengan saku dada bergaya taktis utilitas. Cocok untuk tampilan perkotaan yang minimalis dan fungsional.",
    price: 139000,
    material: "100% Cotton Combed 24s",
    care: "Aman dicuci mesin. Setrika suhu sedang.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Baik",
    colors: ["Hijau Army", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800", alt: "Pocket Tee Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Heavyweight Long Sleeve Tee",
    slug: "barbara-heavyweight-long-sleeve-tee",
    description: "Kaos lengan panjang kain katun tebal dengan rib manset di pergelangan tangan. Melindungi dari angin saat beraktivitas di luar ruangan.",
    price: 179000,
    material: "100% Heavyweight Cotton 20s",
    care: "Cuci dengan air dingin dan warna serupa.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Navy", "Putih"],
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      { url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800", alt: "Long Sleeve Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Classic Pique Polo Shirt",
    slug: "barbara-classic-pique-polo-shirt",
    description: "Kemeja polo bahan kain rajut pique bertekstur rapat. Memberikan nuansa smart-casual yang rapi dan elegan.",
    price: 199000,
    material: "100% Cotton Pique Premium",
    care: "Setrika kerah dengan teliti agar tetap berdiri tegak.",
    categorySlug: "tops",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Merah", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800", alt: "Polo Shirt Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Waffle Knit Henley Shirt",
    slug: "barbara-waffle-knit-henley-shirt",
    description: "Kemeja henley dengan kancing dada tanpa kerah dari bahan kain bermotif waffle knit. Tekstur hangat dan berkarakter.",
    price: 219000,
    material: "Cotton Waffle Knit Fabric",
    care: "Jangan disikat terlalu keras agar serat rajut waffle tidak merenggang.",
    categorySlug: "tops",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Coklat", "Beige"],
    sizes: ["M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800", alt: "Henley Shirt Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Heavy Flannel Plaid Shirt",
    slug: "barbara-heavy-flannel-plaid-shirt",
    description: "Kemeja flannel tebal motif kotak-kotak klasik. Sangat hangat dan fleksibel dipakai sebagai kemeja maupun outer.",
    price: 249000,
    material: "100% Brushed Flannel Cotton",
    care: "Cuci dengan air hangat suam-suam kuku, jemur gantung.",
    categorySlug: "tops",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Maroon", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800", alt: "Flannel Shirt Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Premium Oxford Cotton Shirt",
    slug: "barbara-premium-oxford-cotton-shirt",
    description: "Kemeja berkerah kancing (button-down) bahan kain oxford bertekstur halus. Pilihan sempurna untuk keperluan formal maupun semi-formal.",
    price: 269000,
    material: "100% Oxford Cotton",
    care: "Setrika dengan pelicin pakaian untuk hasil halus sempurna.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Biru", "Putih"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", alt: "Oxford Shirt Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Cuban Collar Rayon Shirt",
    slug: "barbara-cuban-collar-rayon-shirt",
    description: "Kemeja kerah terbuka (cuba collar) bahan sutra rayon yang halus dan dingin. Memberikan kesan santai tropis yang trendi.",
    price: 229000,
    material: "100% Premium Silk Rayon",
    care: "Cuci manual dengan tangan. Hindari perasan kencang.",
    categorySlug: "tops",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Mustard", "Kuning"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", alt: "Cuban Shirt Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Striped Casual Tee",
    slug: "barbara-striped-casual-tee",
    description: "Kaos motif salur/garis-garis horizontal berdesain timeless. Memberikan siluet berkesan dinamis dan bergaya french chic.",
    price: 119000,
    material: "100% Fine Cotton Yarn-dyed",
    care: "Cuci mesin dingin bersama warna senada.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    condition: "Baik",
    colors: ["Navy", "Putih"],
    sizes: ["XS", "S", "M"],
    images: [
      { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800", alt: "Striped Tee Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Cropped Minimalist Tee",
    slug: "barbara-cropped-minimalist-tee",
    description: "Kaos model potong gantung (crop top) dengan jahitan rapi di bagian pinggang. Ringan, kasual, dan modis.",
    price: 109000,
    material: "95% Cotton 5% Elastane",
    care: "Jemur datar di tempat teduh.",
    categorySlug: "tops",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Pink", "Putih"],
    sizes: ["XS", "S", "M"],
    images: [
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800", alt: "Crop Tee Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Linen Relaxed Fit Shirt",
    slug: "barbara-linen-relaxed-fit-shirt",
    description: "Kemeja bahan serat linen alami bersirkulasi udara tinggi. Memberikan rasa dingin maksimal pada kulit di cuaca terik.",
    price: 279000,
    material: "100% Organic Linen",
    care: "Setrika saat agak lembab.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    condition: "Sangat Baik",
    colors: ["Khaki", "Beige"],
    sizes: ["S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", alt: "Linen Shirt Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Ribbed Casual Tank Top",
    slug: "barbara-ribbed-casual-tank-top",
    description: "Tank top kain katun rajut elastis (ribbed) fleksibel menempel pas di badan. Pilihan ideal untuk dalaman maupun pakaian santai.",
    price: 99000,
    material: "Ribbed Cotton Stretch",
    care: "Cuci dengan tangan, hindari gantung terlalu ditarik.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Hitam", "Cream"],
    sizes: ["XS", "S", "M"],
    images: [
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800", alt: "Tank Top Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Embroidered Logo Tee",
    slug: "barbara-embroidered-logo-tee",
    description: "Kaos katun premium dengan detail bordir logo BARBARA berukuran presisi di bagian dada kiri.",
    price: 159000,
    material: "100% Combed Cotton 24s",
    care: "Setrika bagian dalam saja.",
    categorySlug: "tops",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.MEN,
    condition: "Baik",
    colors: ["Ungu", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", alt: "Logo Tee Front", order: 0 }
    ]
  },

  // ==================== BOTTOM (14 Products: Rp149.000 – Rp399.000) ====================
  {
    name: "BARBARA Heavy Canvas Cargo Pants",
    slug: "barbara-heavy-canvas-cargo-pants",
    description: "Celana panjang kargo bahan kanvas tebal dengan 6 saku utilitas ekstra lapang. Tahan gesekan dan kokoh.",
    price: 299000,
    material: "100% Cotton Canvas Ripstop",
    care: "Balik celana sebelum dicuci agar warna kanvas awet.",
    categorySlug: "bottom",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Hijau Olive", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Cargo Pants Front", order: 0 }
    ]
  },
  {
    name: "BARBARA 90s Baggy Fit Jeans",
    slug: "barbara-90s-baggy-fit-jeans",
    description: "Celana jeans potongan baggy retro gaya 90-an dengan pencucian washed indigo alami.",
    price: 349000,
    material: "13.5oz Rigid Cotton Denim",
    care: "Hindari terlalu sering dicuci mesin.",
    categorySlug: "bottom",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Denim", "Biru"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Baggy Jeans Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Classic Straight Leg Jeans",
    slug: "barbara-classic-straight-leg-jeans",
    description: "Celana denim potongan lurus (straight leg) serbaguna yang cocok dikombinasikan dengan sepatu sneakers maupun boots.",
    price: 329000,
    material: "13oz Denim Cotton",
    care: "Cuci dengan air dingin.",
    categorySlug: "bottom",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Denim", "Hitam"],
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      { url: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800", alt: "Straight Jeans Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Wide Leg Pleated Trousers",
    slug: "barbara-wide-leg-pleated-trousers",
    description: "Celana panjang kain potongan wide-leg dengan lipatan pleated anggun di pinggang depan.",
    price: 379000,
    material: "Polyester Viscose Blend",
    care: "Setrika ikuti garis celana depan.",
    categorySlug: "bottom",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Beige", "Hitam"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800", alt: "Wide Trousers Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Slim Fit Stretch Chino Pants",
    slug: "barbara-slim-fit-stretch-chino-pants",
    description: "Celana chino bahan kain katun stretch lentur yang elastis bergerak. Rapi dan fleksibel untuk kerja dan hangout.",
    price: 249000,
    material: "98% Cotton 2% Elastane Chino",
    care: "Cuci putaran lembut.",
    categorySlug: "bottom",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Khaki", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800", alt: "Chino Pants Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Tactical Jogger Pants",
    slug: "barbara-tactical-jogger-pants",
    description: "Celana jogger berkerut kencang di pergelangan kaki dengan saku zipper taktis di paha samping.",
    price: 229000,
    material: "Cotton Twill Stretch",
    care: "Jemur terbalik.",
    categorySlug: "bottom",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Baik",
    colors: ["Hitam", "Abu-Abu"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Jogger Pants Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Double Knee Carpenter Pants",
    slug: "barbara-double-knee-carpenter-pants",
    description: "Celana carpenter tahan benturan dengan panel kanvas ganda di lutut dan loop alat tukang.",
    price: 399000,
    material: "14oz Heavy Duck Canvas",
    care: "Sikat bagian kotor jika perlu.",
    categorySlug: "bottom",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Coklat", "Hijau Army"],
    sizes: ["M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Carpenter Pants Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Tailored Pleated Trousers",
    slug: "barbara-tailored-pleated-trousers",
    description: "Celana bahan jahitan penjahit profesional (tailored) dengan fiting jatuh rapi dan nyaman.",
    price: 359000,
    material: "Wool Blend Semi-formal Fabric",
    care: "Dry clean direkomendasikan.",
    categorySlug: "bottom",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Abu-Abu", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800", alt: "Tailored Trousers Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Vintage Wash Denim Shorts",
    slug: "barbara-vintage-wash-denim-shorts",
    description: "Celana pendek jeans denim dengan aksen raw hem (ujung tiras) kasual santai.",
    price: 189000,
    material: "100% Cotton Denim 12oz",
    care: "Cuci mesin biasa.",
    categorySlug: "bottom",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Denim", "Biru"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800", alt: "Denim Shorts Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Utility Cargo Shorts",
    slug: "barbara-utility-cargo-shorts",
    description: "Celana pendek cargo lutut santai dengan saku flap besar serbaguna.",
    price: 179000,
    material: "Cotton Twill Durable",
    care: "Aman dicuci mesin.",
    categorySlug: "bottom",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    condition: "Baik",
    colors: ["Khaki", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800", alt: "Cargo Shorts Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Linen Drawstring Pants",
    slug: "barbara-linen-drawstring-pants",
    description: "Celana santai pinggang tali kerutan dari serat linen murni yang super sejuk.",
    price: 269000,
    material: "100% Organic Linen",
    care: "Setrika hangat saat lembab.",
    categorySlug: "bottom",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    condition: "Sangat Baik",
    colors: ["Cream", "Putih"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800", alt: "Linen Pants Front", order: 0 }
    ]
  },
  {
    name: "BARBARA High-Waist Wide Jeans",
    slug: "barbara-high-waist-wide-jeans",
    description: "Celana jeans pinggang tinggi (high-waist) dengan potongan kaki lebar memberi efek kaki lebih jenjang.",
    price: 369000,
    material: "13oz Denim Cotton Stretch",
    care: "Balik sebelum dicuci.",
    categorySlug: "bottom",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Denim", "Navy"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800", alt: "High-Waist Jeans Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Athleisure Sweatpants",
    slug: "barbara-athleisure-sweatpants",
    description: "Celana training bahan fleece super empuk dengan saku samping dan karet pinggang fleksibel.",
    price: 199000,
    material: "Cotton Fleece 280 gsm",
    care: "Cuci mesin dingin.",
    categorySlug: "bottom",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    condition: "Baik",
    colors: ["Abu-Abu", "Pink"],
    sizes: ["XS", "S", "M"],
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Sweatpants Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Corduroy Straight Trousers",
    slug: "barbara-corduroy-straight-trousers",
    description: "Celana panjang corduroy tekstur salur halus bergaya vintage hangat.",
    price: 289000,
    material: "Fine Wale Corduroy Cotton",
    care: "Jangan disikat kencang.",
    categorySlug: "bottom",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Maroon", "Coklat"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800", alt: "Corduroy Trousers Front", order: 0 }
    ]
  },

  // ==================== OUTERWEAR (13 Products: Rp249.000 – Rp799.000) ====================
  {
    name: "BARBARA Heavyweight Fleece Hoodie",
    slug: "barbara-heavyweight-fleece-hoodie",
    description: "Hoodie bertudung tebal 380gsm dengan bahan fleece rajut tebal super lembut di bagian dalam. Fiting boxy fit.",
    price: 499000,
    material: "Heavyweight Cotton Fleece 380 gsm",
    care: "Cuci putaran lembut, jangan gunakan mesin pengering bersuhu panas.",
    categorySlug: "outerwear",
    collection: Collection.OVERSIZED_COLLECTION,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Hitam", "Abu-Abu"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", alt: "Fleece Hoodie Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Full-Zip Oversized Hoodie",
    slug: "barbara-full-zip-oversized-hoodie",
    description: "Hoodie ritsleting penuh (full-zip) dengan ritsleting logam YKK tahan lama dan saku kanguru ganda.",
    price: 529000,
    material: "Cotton Fleece 350 gsm",
    care: "Tutup ritsleting saat mencuci.",
    categorySlug: "outerwear",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Navy", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", alt: "Zip Hoodie Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Minimalist Crewneck Sweatshirt",
    slug: "barbara-minimalist-crewneck-sweatshirt",
    description: "Sweater tanpa tudung (crewneck) kasual dari bahan fleece hangat bersiluet bersih.",
    price: 399000,
    material: "Cotton Fleece 300 gsm",
    care: "Cuci mesin dingin.",
    categorySlug: "outerwear",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Cream", "Mustard"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1556821741-704ce4895446?w=800", alt: "Crewneck Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Retro Varsity Bomber Jacket",
    slug: "barbara-retro-varsity-bomber-jacket",
    description: "Jaket varsity gaya kampus retro dengan kancing jepret dan rib bermotif garis kontras.",
    price: 699000,
    material: "Wool Blend Body & Synthetic Leather Sleeves",
    care: "Dry clean saja.",
    categorySlug: "outerwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Maroon", "Putih"],
    sizes: ["M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800", alt: "Varsity Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Flight Bomber Jacket",
    slug: "barbara-flight-bomber-jacket",
    description: "Jaket bomber militer penerbang berlapis padding hangat dan nilon mengkilap anti air.",
    price: 649000,
    material: "Nylon Flight Satin with Polyester Padding",
    care: "Dry clean direkomendasikan.",
    categorySlug: "outerwear",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Hijau Army", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Bomber Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Nylon Street Coach Jacket",
    slug: "barbara-nylon-street-coach-jacket",
    description: "Jaket coach bahan nilon tahan angin ringan dengan kancing cetet dan tali serut di pinggang bawah.",
    price: 449000,
    material: "100% Taslan Nylon Water Repellent",
    care: "Lap dengan spons lembab.",
    categorySlug: "outerwear",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.MEN,
    condition: "Baik",
    colors: ["Hitam", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Coach Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Technical Ripstop Windbreaker",
    slug: "barbara-technical-ripstop-windbreaker",
    description: "Jaket windbreaker ultra ringan anti air untuk perlindungan dari hujan gerimis dan angin tajam.",
    price: 479000,
    material: "Nylon Ripstop DWR Coated",
    care: "Jangan disetrika.",
    categorySlug: "outerwear",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Orange", "Hitam"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Windbreaker Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Trucker Denim Jacket",
    slug: "barbara-trucker-denim-jacket",
    description: "Jaket jeans denim gaya trucker klasik dengan kancing logam kuningan tebal.",
    price: 599000,
    material: "14oz Indigo Denim",
    care: "Cuci terbalik dengan air dingin.",
    categorySlug: "outerwear",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Denim", "Biru"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800", alt: "Denim Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Canvas Utility Field Jacket",
    slug: "barbara-canvas-utility-field-jacket",
    description: "Jaket lapangan (field jacket) bertipe workwear utilitas dengan 4 saku flap besar di depan.",
    price: 579000,
    material: "Heavy Cotton Canvas",
    care: "Bersihkan noda lokal dengan kain lembab.",
    categorySlug: "outerwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Khaki", "Hijau Olive"],
    sizes: ["M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800", alt: "Field Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Soft Fleece Zip Jacket",
    slug: "barbara-soft-fleece-zip-jacket",
    description: "Jaket luaran fleece lembut berbulu hangat cocok dipakai saat jalan-jalan santai di daerah dingin.",
    price: 349000,
    material: "100% Polar Fleece",
    care: "Jangan disetrika panas.",
    categorySlug: "outerwear",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    condition: "Baik",
    colors: ["Beige", "Pink"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      { url: "https://images.unsplash.com/photo-1556821741-704ce4895446?w=800", alt: "Fleece Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Heavy Quilted Puffer Jacket",
    slug: "barbara-heavy-quilted-puffer-jacket",
    description: "Jaket puffer bervolume tebal berlapis kapuk sintesis ultra hangat penahan cuaca dingin ekstrem.",
    price: 749000,
    material: "Polyester Micro Ripstop with Synthetic Down Padding",
    care: "Jemur cuci angin.",
    categorySlug: "outerwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    condition: "Baru",
    colors: ["Hitam", "Navy"],
    sizes: ["M", "L", "XL", "XXL"],
    images: [
      { url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800", alt: "Puffer Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Winter Waterproof Parka",
    slug: "barbara-winter-waterproof-parka",
    description: "Jaket parka panjang dengan tudung bertali serut penahan angin dan hujan salju/deras.",
    price: 799000,
    material: "Heavy Duty Taslan Waterproof",
    care: "Dry clean.",
    categorySlug: "outerwear",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    condition: "Sangat Baik",
    colors: ["Hijau Army", "Hitam"],
    sizes: ["M", "L", "XL"],
    images: [
      { url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800", alt: "Parka Jacket Front", order: 0 }
    ]
  },
  {
    name: "BARBARA Oversized Cropped Denim Jacket",
    slug: "barbara-oversized-cropped-denim-jacket",
    description: "Jaket denim wanita model gantung cropped fit bergaya modern street style.",
    price: 549000,
    material: "12oz Denim Cotton",
    care: "Cuci terbalik.",
    categorySlug: "outerwear",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    condition: "Baru",
    colors: ["Denim", "Putih"],
    sizes: ["XS", "S", "M"],
    images: [
      { url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800", alt: "Cropped Denim Jacket Front", order: 0 }
    ]
  }
];

async function main() {
  console.log("=== RESET & SEED DATABASE TEST BARBARA E-COMMERCE ===");

  // 1. Clean existing dependent data cleanly to prevent foreign key errors
  console.log("Membuang data produk lama...");
  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  console.log("✓ Data produk & kategori lama berhasil dibersihkan");

  // 2. Seed Users
  console.log("Menyiapkan akun pengguna...");
  const [adminPassword, customerPassword] = await Promise.all([
    bcrypt.hash("Admin123!", 10),
    bcrypt.hash("Customer123!", 10),
  ]);

  await prisma.user.upsert({
    where: { email: "admin@barbara.com" },
    update: { password: adminPassword },
    create: {
      name: "BARBARA Admin",
      email: "admin@barbara.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@barbara.com" },
    update: { password: customerPassword },
    create: {
      name: "BARBARA Customer",
      email: "customer@barbara.com",
      password: customerPassword,
      role: Role.USER,
    },
  });
  console.log("✓ Akun admin & customer siap");

  // 3. Seed 3 Categories ONLY
  console.log("Membuat 3 kategori utama (Tops, Bottom, Outerwear)...");
  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
    categoryMap[cat.slug] = createdCat.id;
    console.log(`  - Kategori "${cat.name}" (${cat.slug}) dibuat.`);
  }

  // 4. Seed 42 Products & Variants
  console.log("Membuat 42 produk baru dengan varian & gambar lengkap...");
  let count = 0;
  for (const prod of productsData) {
    count++;
    const categoryId = categoryMap[prod.categorySlug];

    // Format size & color strings for exact comma-padding filter search (e.g. ",S,M,L,")
    const formattedSizeString = `,${prod.sizes.join(",")},`;
    const formattedColorString = `,${prod.colors.join(",")},`;
    const randomLikes = Math.floor(Math.random() * 180) + 20;

    const product = await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        material: prod.material,
        care: prod.care,
        collection: prod.collection,
        gender: prod.gender,
        condition: prod.condition,
        brand: "BARBARA",
        size: formattedSizeString,
        color: formattedColorString,
        categorySlug: prod.categorySlug,
        categoryId: categoryId,
        isNew: prod.condition === "Baru",
        isActive: true,
        likesCount: randomLikes,
        images: {
          create: prod.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            order: img.order,
          })),
        },
      },
    });

    // Create Variants (Color x Size)
    for (const colorName of prod.colors) {
      const colorMeta = COLOR_MAP[colorName] || { hex: "#000000", code: "CLR" };
      for (const sizeName of prod.sizes) {
        const sku = `BAR-${prod.categorySlug.substring(0, 3).toUpperCase()}-${String(count).padStart(3, "0")}-${colorMeta.code}-${sizeName}`;
        const stock = Math.floor(Math.random() * 25) + 10; // random stock between 10 & 35

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: sizeName,
            color: colorName,
            colorHex: colorMeta.hex,
            stock: stock,
            sku: sku,
          },
        });
      }
    }

    console.log(`  [${count}/42] ✓ "${prod.name}" (${prod.categorySlug} | ${prod.gender} | ${prod.condition} | Rp${prod.price.toLocaleString("id-ID")})`);
  }

  console.log("\n=======================================================");
  console.log("✅ SEEDING DATABASE SELESAI SUKSES!");
  console.log("Total Produk Dibuat: 42 Produk");
  console.log("Distribusi Kategori:");
  console.log(" - Tops      : 15 Produk (Rp 99.000 - Rp 299.000)");
  console.log(" - Bottom    : 14 Produk (Rp 149.000 - Rp 399.000)");
  console.log(" - Outerwear : 13 Produk (Rp 249.000 - Rp 799.000)");
  console.log("=======================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
