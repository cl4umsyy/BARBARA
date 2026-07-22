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

const categoriesData = [
  { name: "New Arrivals", slug: "new-arrivals", description: "Produk terbaru yang baru dirilis di BARBARA." },
  { name: "Best Sellers", slug: "best-sellers", description: "Produk yang paling banyak dibeli oleh pelanggan." },
  { name: "Graphic Tees", slug: "graphic-tees", description: "Koleksi kaos dengan desain grafis dan artwork eksklusif." },
  { name: "Oversized Collection", slug: "oversized-collection", description: "Koleksi kaos dan hoodie oversized dengan fit longgar dan nyaman." },
  { name: "Essentials", slug: "essentials", description: "Koleksi pakaian basic dan minimalis untuk dipakai setiap hari." },
  { name: "Limited Edition", slug: "limited-edition", description: "Produk edisi terbatas dengan stok yang sangat sedikit." },
  { name: "Tops", slug: "tops", description: "Koleksi atasan BARBARA: Kaos, Kemeja, Jaket, Hoodie." },
  { name: "Bottoms", slug: "bottoms", description: "Koleksi bawahan BARBARA: Celana panjang, pendek, jeans." },
  { name: "Outerwear", slug: "outerwear", description: "Koleksi luaran BARBARA: Jaket tebal, mantel, bomber." },
  { name: "Footwear", slug: "footwear", description: "Koleksi alas kaki BARBARA: Sepatu, sandal." }
];

const productsData = [
  // --- KAOS / TOPS (5) ---
  {
    name: "BARBARA Oversized Noir Tee",
    slug: "barbara-oversized-noir-tee",
    description: "Kaos oversized katun premium berwarna hitam dengan detail visual yang bold. Potongan kain boxy fit yang memberikan siluet modern dan santai.",
    price: 299000,
    material: "100% Heavyweight Cotton 24s",
    care: "Cuci dengan air dingin, jangan disetrika pada bagian print grafis.",
    categorySlug: "tops",
    collection: Collection.OVERSIZED_COLLECTION,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800", alt: "Front view image", order: 0 },
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", alt: "Detail view image", order: 1 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "White", hex: "#ffffff", skuCode: "WHT" }
    ]
  },
  {
    name: "BARBARA Acid Wash Vintage Tee",
    slug: "barbara-acid-wash-vintage-tee",
    description: "Kaos bergaya vintage dengan proses pencucian acid wash yang memberikan tekstur warna memudar estetik. Sangat nyaman untuk gaya kasual sehari-hari.",
    price: 329000,
    material: "100% Premium Cotton Terry",
    care: "Cuci terpisah dengan warna serupa. Jemur di tempat teduh.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800", alt: "Acid Wash Tee front", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" },
      { name: "Navy", hex: "#000080", skuCode: "NVY" }
    ]
  },
  {
    name: "BARBARA Graphic Cyberpunk Tee",
    slug: "barbara-graphic-cyberpunk-tee",
    description: "Kaos dengan grafis futuristik bertema cyberpunk di bagian belakang. Dicetak menggunakan tinta plastisol kualitas tinggi yang tahan lama.",
    price: 349000,
    material: "100% Heavyweight Cotton 20s",
    care: "Setrika bagian dalam baju saja. Cuci dengan mesin menggunakan air dingin.",
    categorySlug: "tops",
    collection: Collection.GRAPHIC_TEES,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800", alt: "Cyberpunk Tee front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Heavyweight Blank Tee",
    slug: "barbara-heavyweight-blank-tee",
    description: "Kaos polos basic dengan bahan katun sangat tebal yang memberikan ketahanan ekstra dan mempertahankan bentuk kaos walau sering dicuci.",
    price: 249000,
    material: "100% Heavyweight Cotton 16s Open-End",
    care: "Aman dicuci dengan mesin. Gunakan pemutih non-klorin jika diperlukan.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800", alt: "Blank Tee Front", order: 0 }
    ],
    colors: [
      { name: "White", hex: "#ffffff", skuCode: "WHT" },
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Distressed Grunge Tee",
    slug: "barbara-distressed-grunge-tee",
    description: "Kaos dengan detail distressed (sobekan halus buatan) pada kerah dan keliman bawah untuk memberikan nuansa grunge ala tahun 90-an.",
    price: 319000,
    material: "100% Combed Cotton 24s",
    care: "Disarankan cuci dengan tangan secara perlahan demi menjaga keutuhan serat robekan.",
    categorySlug: "tops",
    collection: Collection.GRAPHIC_TEES,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800", alt: "Distressed Tee front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },

  // --- OUTERWEAR / HOODIES (5) ---
  {
    name: "BARBARA Classic Black Boxy Hoodie",
    slug: "barbara-classic-black-boxy-hoodie",
    description: "Hoodie bersiluet boxy dengan bahan fleece super tebal dan lembut. Dilengkapi dengan tudung kepala ganda dan saku kanguru yang fungsional.",
    price: 549000,
    material: "Heavyweight Cotton Fleece 380 gsm",
    care: "Jangan gunakan mesin pengering. Cuci dengan putaran lambat.",
    categorySlug: "outerwear",
    collection: Collection.OVERSIZED_COLLECTION,
    gender: ProductGender.WOMEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", alt: "Black Hoodie Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Heavyweight Olive Hoodie",
    slug: "barbara-heavyweight-olive-hoodie",
    description: "Hoodie tebal berwarna hijau zaitun (olive) dengan jahitan drop shoulder. Sangat hangat dan cocok dipadukan dengan celana cargo.",
    price: 549000,
    material: "Heavyweight Cotton Fleece 380 gsm",
    care: "Cuci dengan air dingin berputar lembut. Jangan disetrika langsung di atas bahan fleece hangat.",
    categorySlug: "outerwear",
    collection: Collection.OVERSIZED_COLLECTION,
    gender: ProductGender.WOMEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1556821741-704ce4895446?w=800", alt: "Olive Hoodie Front", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Zip-up Charcoal Hoodie",
    slug: "barbara-zip-up-charcoal-hoodie",
    description: "Hoodie model ritsleting penuh (zip-up) dengan warna abu-abu arang. Menggunakan ritsleting logam YKK berkualitas tinggi.",
    price: 579000,
    material: "Cotton Fleece Blend 350 gsm",
    care: "Tutup ritsleting sebelum mencuci. Cuci dengan mesin menggunakan air dingin.",
    categorySlug: "outerwear",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", alt: "Charcoal Zip Hoodie Front", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Cyber-Goth Graphic Hoodie",
    slug: "barbara-cyber-goth-graphic-hoodie",
    description: "Hoodie bertema cyber-goth dengan grafis sablon tebal pada bagian lengan dan tudung kepala. Memberikan tampilan yang edgy.",
    price: 599000,
    material: "100% Premium Fleece 360 gsm",
    care: "Balik pakaian saat dicuci. Sablon jangan disetrika langsung.",
    categorySlug: "outerwear",
    collection: Collection.GRAPHIC_TEES,
    gender: ProductGender.WOMEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", alt: "Goth Hoodie Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Acid Wash Sand Hoodie",
    slug: "barbara-acid-wash-sand-hoodie",
    description: "Hoodie katun rajut tebal bertekstur acid wash dengan nuansa warna pasir. Nyaman dipakai saat cuaca dingin.",
    price: 589000,
    material: "Heavyweight Cotton Fleece 380 gsm",
    care: "Cuci dengan air dingin dan putaran lambat bersama pakaian dengan warna senada.",
    categorySlug: "outerwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.WOMEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1556821741-704ce4895446?w=800", alt: "Sand Hoodie Front", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },

  // --- OUTERWEAR / JACKETS (5) ---
  {
    name: "BARBARA Canvas Work Jacket",
    slug: "barbara-canvas-work-jacket",
    description: "Jaket bertipe workwear klasik dengan bahan kanvas kasar yang kuat. Dilengkapi dengan kerah corduroy berwarna coklat kontras dan furing hangat di bagian dalam.",
    price: 899000,
    material: "100% Heavy Duty Cotton Duck Canvas",
    care: "Cukup bersihkan noda kecil dengan sikat basah. Cuci kering (dry clean) untuk hasil terbaik.",
    categorySlug: "outerwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Work Jacket Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Navy", hex: "#000080", skuCode: "NVY" }
    ]
  },
  {
    name: "BARBARA Denim Vintage Trucker",
    slug: "barbara-denim-vintage-trucker",
    description: "Jaket denim gaya trucker dengan efek luntur vintage alami. Dibuat menggunakan selvedge denim berkualitas premium.",
    price: 799000,
    material: "14oz Indigo Rigid Selvedge Denim",
    care: "Jarang dicuci untuk menjaga warna memudar alami. Jika terpaksa, cuci manual dengan tangan menggunakan air dingin.",
    categorySlug: "outerwear",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800", alt: "Denim Jacket Front", order: 0 }
    ],
    colors: [
      { name: "Navy", hex: "#000080", skuCode: "NVY" }
    ]
  },
  {
    name: "BARBARA Technical Windbreaker",
    slug: "barbara-technical-windbreaker",
    description: "Jaket penahan angin dengan bahan anti air (water-resistant) yang ringan namun kuat. Cocok digunakan untuk aktivitas outdoor modern.",
    price: 699000,
    material: "Nylon Ripstop dengan Lapisan DWR",
    care: "Jangan disetrika. Lap noda dengan kain lembab atau cuci lembut tanpa deterjen keras.",
    categorySlug: "outerwear",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Windbreaker Jacket Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Bomber Classic Jacket",
    slug: "barbara-bomber-classic-jacket",
    description: "Jaket bomber militer klasik dengan bahan nilon berkilau sedang. Menampilkan saku utilitas khas di bagian lengan kiri.",
    price: 749000,
    material: "Nylon Flight Satin with Polyester Padding",
    care: "Cuci dengan dry clean profesional. Simpan di gantungan baju yang kokoh.",
    categorySlug: "outerwear",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Bomber Jacket Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Distressed Leather Jacket",
    slug: "barbara-distressed-leather-jacket",
    description: "Jaket kulit asli bertekstur lecet distressed artistik. Memberikan kesan maskulin yang kuat dan abadi.",
    price: 1899000,
    material: "100% Genuine Lambskin Leather",
    care: "Hanya boleh dibersihkan oleh spesialis perawatan kulit (leather care specialist).",
    categorySlug: "outerwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Leather Jacket Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },

  // --- SHIRTS / TOPS (5) ---
  {
    name: "BARBARA Flannel Heavyweight Plaid",
    slug: "barbara-flannel-heavyweight-plaid",
    description: "Kemeja flannel tebal dengan motif kotak-kotak klasik. Sangat cocok dipakai sebagai luaran (outer) di atas kaos basic.",
    price: 449000,
    material: "100% Heavy Flannel Cotton",
    care: "Cuci mesin dengan air dingin, jemur gantung, setrika dengan suhu hangat.",
    categorySlug: "tops",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.WOMEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800", alt: "Flannel Shirt Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Corduroy Oversized Shirt",
    slug: "barbara-corduroy-oversized-shirt",
    description: "Kemeja corduroy bertekstur garis-garis halus dengan fitting oversized. Bahan lembut namun berbobot memberikan drape baju yang mewah.",
    price: 479000,
    material: "Soft Corduroy Cotton Blend",
    care: "Cuci dengan air dingin dan jangan diperas terlalu kencang untuk mempertahankan serat corduroy.",
    categorySlug: "tops",
    collection: Collection.OVERSIZED_COLLECTION,
    gender: ProductGender.WOMEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800", alt: "Corduroy Shirt Front", order: 0 }
    ],
    colors: [
      { name: "Navy", hex: "#000080", skuCode: "NVY" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Linen Casual White Shirt",
    slug: "barbara-linen-casual-white-shirt",
    description: "Kemeja linen kasual berkerah mandarin (kerah koko) berwarna putih bersih. Sangat adem dan bernapas, ideal untuk iklim tropis hangat.",
    price: 399000,
    material: "100% Pure Linen Cotton",
    care: "Setrika saat pakaian masih agak lembab untuk hasil rapi instan.",
    categorySlug: "tops",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.WOMEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", alt: "Linen Shirt Front", order: 0 }
    ],
    colors: [
      { name: "White", hex: "#ffffff", skuCode: "WHT" }
    ]
  },
  {
    name: "BARBARA Cargo Military Green Shirt",
    slug: "barbara-cargo-military-green-shirt",
    description: "Kemeja bergaya militer dengan dua saku cargo besar berpenutup kancing di dada depan. Terbuat dari bahan ripstop kuat.",
    price: 459000,
    material: "Cotton Ripstop Durable Fabric",
    care: "Aman dicuci mesin bersama pakaian warna serupa. Jangan setrika sablon label leher.",
    categorySlug: "tops",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800", alt: "Cargo Shirt Front", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Cubacollar Summer Shirt",
    slug: "barbara-cubacollar-summer-shirt",
    description: "Kemeja kerah pendek (cuba collar) dengan bahan sutra rayon jatuh yang dingin. Memberikan nuansa liburan musim panas yang relaks.",
    price: 379000,
    material: "Premium Silk Rayon Blend",
    care: "Cuci dengan tangan, jemur gantung, setrika dengan tingkat panas rendah.",
    categorySlug: "tops",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", alt: "Cuba Collar Shirt Front", order: 0 }
    ],
    colors: [
      { name: "White", hex: "#ffffff", skuCode: "WHT" },
      { name: "Navy", hex: "#000080", skuCode: "NVY" }
    ]
  },

  // --- PANTS / BOTTOMS (5) ---
  {
    name: "BARBARA Carpenter Canvas Double Knee",
    slug: "barbara-carpenter-canvas-double-knee",
    description: "Celana carpenter tangguh dengan panel double-knee di bagian lutut kaki. Dilengkapi gantungan palu khas workwear utilitas.",
    price: 649000,
    material: "12oz Premium Canvas Cotton",
    care: "Balik celana saat mencuci guna melindungi panel canvas lutut agar warna merata.",
    categorySlug: "bottoms",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Carpenter Pants Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Wide-Leg Cargo Pants",
    slug: "barbara-wide-leg-cargo-pants",
    description: "Celana panjang kargo dengan fitting lebar (wide-leg) yang sedang tren. Menyediakan saku samping lapang untuk memuat barang bawaan.",
    price: 599000,
    material: "Cotton Twill Ripstop",
    care: "Aman dicuci mesin, setrika dengan suhu sedang untuk merapikan lipatan celana.",
    categorySlug: "bottoms",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Cargo Pants Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Baggy Vintage Denim",
    slug: "barbara-baggy-vintage-denim",
    description: "Celana jeans berpotongan baggy gombrang bergaya retro vintage tahun 90-an dengan efek pencucian washed indigo lembut.",
    price: 679000,
    material: "100% Cotton Denim 13oz",
    care: "Jangan terlalu sering dicuci demi ketahanan serat kain jeans vintage.",
    categorySlug: "bottoms",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Vintage Denim Front", order: 0 }
    ],
    colors: [
      { name: "Navy", hex: "#000080", skuCode: "NVY" }
    ]
  },
  {
    name: "BARBARA Minimalist Pleated Chino",
    slug: "barbara-minimalist-pleated-chino",
    description: "Celana chino minimalis dengan lipatan (pleats) di pinggang depan. Memberikan siluet rapi, smart-casual namun tetap santai.",
    price: 529000,
    material: "Premium Cotton Stretch Chino",
    care: "Cuci dengan air dingin dan gosok rapi mengikuti arah garis lipatan depan.",
    categorySlug: "bottoms",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Pleated Chino Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Tech Nylon Track Pants",
    slug: "barbara-tech-nylon-track-pants",
    description: "Celana olahraga technical dengan bahan nilon ringan berlapis jaring halus di bagian dalam. Menggunakan karet pinggang fleksibel.",
    price: 499000,
    material: "Lightweight Tech Nylon Ripstop",
    care: "Disarankan cuci mesin dalam kantong khusus (mesh bag) agar tidak merusak bahan nilon ringan.",
    categorySlug: "bottoms",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Tech Pants Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },

  // --- FOOTWEAR / SHOES & SLIDES (6) ---
  {
    name: "BARBARA Streetwear Slides Noir",
    slug: "barbara-streetwear-slides-noir",
    description: "Sandal slide kasual yang sangat nyaman dengan bahan foam empuk berdesain ergonomis. Cocok untuk penggunaan sehari-hari maupun santai.",
    price: 189000,
    material: "100% EVA Lightweight Foam",
    care: "Hindari panas terik matahari langsung saat menjemur.",
    categorySlug: "footwear",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800", alt: "Slides Noir view", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Low-Top Classic Sneakers",
    slug: "barbara-lowtop-classic-sneakers",
    description: "Sepatu sneakers low-top klasik berwarna putih bersih dengan bahan kulit sintetis premium dan sol karet anti slip.",
    price: 459000,
    material: "Premium Faux Leather with Rubber Soles",
    care: "Lap dengan sponge basah dan cleaner sepatu khusus.",
    categorySlug: "footwear",
    collection: Collection.NEW_ARRIVALS,
    gender: ProductGender.WOMEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "Sneakers White View", order: 0 }
    ],
    colors: [
      { name: "White", hex: "#ffffff", skuCode: "WHT" }
    ]
  },
  {
    name: "BARBARA Chunky Platform Slides",
    slug: "barbara-chunky-platform-slides",
    description: "Sandal platform tebal (chunky style) untuk kenyamanan melangkah ekstra dengan drape modern. Nyaman dan trendy.",
    price: 299000,
    material: "Eva Platform Rubber Foam",
    care: "Cukup bilas air bersih mengalir jika terkena kotoran tanah.",
    categorySlug: "footwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.WOMEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "Platform Slides View", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA High-Top Street Sneakers",
    slug: "barbara-hightop-street-sneakers",
    description: "Sneakers high-top bergaya jalanan (street style) dengan detail velcro strap atas dan mesh lining bernapas di dalam.",
    price: 799000,
    material: "Suede Leather, Mesh & Rubber Soles",
    care: "Gunakan sikat khusus suede (suede brush) pelan untuk merapikan bulu halus suede.",
    categorySlug: "footwear",
    collection: Collection.BEST_SELLERS,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "High-Top Sneakers View", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Retro Running Trainers",
    slug: "barbara-retro-running-trainers",
    description: "Sepatu olahraga running trainer bergaya retro tahun 80-an dengan cushion sol ultra empuk untuk berjalan jauh.",
    price: 699000,
    material: "Nylon & Suede Panel Overlays",
    care: "Lap dengan sponge pembersih kering. Hindari mesin cuci.",
    categorySlug: "footwear",
    collection: Collection.ESSENTIALS,
    gender: ProductGender.MEN,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "Retro Trainers View", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Minimalist Leather Loafers",
    slug: "barbara-minimalist-leather-loafers",
    description: "Sepatu loafers kulit minimalis slip-on yang rapi dan elegan. Sangat mewah dipakai pada acara semi-formal maupun formal.",
    price: 849000,
    material: "100% Genuine Calfskin Leather",
    care: "Gunakan semir sepatu hitam (leather wax) berkualitas agar tetap mengkilap.",
    categorySlug: "footwear",
    collection: Collection.LIMITED_EDITION,
    gender: ProductGender.MEN,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", alt: "Leather Loafers View", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  }
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

async function main() {
  console.log("=== MEMULAI PROSES SEEDING DATABASE BARBARA ===");

  // 1. Seed Users (Upsert pattern to avoid duplicates)
  console.log("Seeding users...");
  const [adminPassword, customerPassword] = await Promise.all([
    bcrypt.hash("Admin123!", 10),
    bcrypt.hash("Customer123!", 10),
  ]);

  // Check and create admin user
  const admin = await prisma.user.findFirst({ where: { email: "admin@barbara.com" } });
  if (!admin) {
    await prisma.user.create({
      data: {
        name: "BARBARA Admin",
        email: "admin@barbara.com",
        password: adminPassword,
        role: Role.ADMIN,
      },
    });
    console.log("✓ User admin berhasil dibuat");
  } else {
    console.log("✓ User admin sudah terdaftar, lewati pembuatan.");
  }

  // Check and create customer user
  const customer = await prisma.user.findFirst({ where: { email: "customer@barbara.com" } });
  if (!customer) {
    await prisma.user.create({
      data: {
        name: "BARBARA Customer",
        email: "customer@barbara.com",
        password: customerPassword,
        role: Role.USER,
      },
    });
    console.log("✓ User customer berhasil dibuat");
  } else {
    console.log("✓ User customer sudah terdaftar, lewati pembuatan.");
  }

  // 2. Seed Categories (Upsert)
  const categoryMap: Record<string, string> = {};
  console.log("Seeding categories...");
  for (const cat of categoriesData) {
    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
    categoryMap[cat.slug] = upsertedCat.id;
    console.log(`✓ Kategori "${cat.name}" berhasil dibuat / diupdate`);
  }



  // 4. Seed Products (Idempotent loop with clear & rebuild of child records)
  console.log("Seeding products & variants...");
  for (const prod of productsData) {
    const categoryId = categoryMap[prod.categorySlug];
    if (!categoryId) {
      console.warn(`Warning: Category ID not found for slug: ${prod.categorySlug}. Skipping product ${prod.name}`);
      continue;
    }

    // Upsert the main Product record based on unique slug
    const upsertedProduct = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        material: prod.material,
        care: prod.care,
        isNew: prod.isNew,
        categoryId: categoryId,
        collection: prod.collection,
        gender: prod.gender,
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        material: prod.material,
        care: prod.care,
        isNew: prod.isNew,
        categoryId: categoryId,
        isActive: true,
        collection: prod.collection,
        gender: prod.gender,
      },
    });

    console.log(`✓ Produk "${prod.name}" berhasil ditambahkan / diupdate`);

    // Clean out old images to prevent stale media records
    await prisma.productImage.deleteMany({ where: { productId: upsertedProduct.id } });

    // Seed new Images
    const imageData = prod.images.map((img) => ({
      productId: upsertedProduct.id,
      url: img.url,
      alt: img.alt,
      order: img.order,
    }));
    await prisma.productImage.createMany({ data: imageData });

    // Seed/update Variants (combinatorial Size x Color) using upsert to avoid foreign key violations
    for (const color of prod.colors) {
      for (const size of sizes) {
        // Generate a clean deterministic unique SKU code
        const safeProductCode = prod.slug.substring(0, 10).toUpperCase();
        const sku = `BBR-${safeProductCode}-${color.skuCode}-${size}`;
        const stock = Math.floor(Math.random() * 25) + 5; // Random stock between 5 and 30

        await prisma.productVariant.upsert({
          where: { sku: sku },
          update: {
            stock: stock,
          },
          create: {
            productId: upsertedProduct.id,
            size: size,
            color: color.name,
            colorHex: color.hex,
            stock: stock,
            sku: sku,
          },
        });
      }
    }
    console.log(`✓ Varian & Gambar untuk "${prod.name}" berhasil dibuat / diperbarui`);
  }

  console.log("\n=== SEEDER SELESAI DENGAN SUKSES ===");
  console.log("Akun Uji Coba:");
  console.log(" - Admin: admin@barbara.com / Admin123!");
  console.log(" - Customer: customer@barbara.com / Customer123!");
}

main()
  .catch((error) => {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
