import dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Role, Collection } from "../src/generated/prisma/client";
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
];

const productsData = [
  // --- KAOS (5) ---
  {
    name: "BARBARA Oversized Noir Tee",
    slug: "barbara-oversized-noir-tee",
    description: "Kaos oversized katun premium berwarna hitam dengan detail visual yang bold. Potongan kain boxy fit yang memberikan siluet modern dan santai.",
    price: 299000,
    material: "100% Heavyweight Cotton 24s",
    care: "Cuci dengan air dingin, jangan disetrika pada bagian print grafis.",
    categorySlug: "oversized-collection",
    collection: Collection.OVERSIZED_COLLECTION,
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
    categorySlug: "essentials",
    collection: Collection.ESSENTIALS,
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
    categorySlug: "graphic-tees",
    collection: Collection.GRAPHIC_TEES,
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
    categorySlug: "essentials",
    collection: Collection.ESSENTIALS,
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
    categorySlug: "graphic-tees",
    collection: Collection.GRAPHIC_TEES,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800", alt: "Distressed Tee front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },

  // --- HOODIE (5) ---
  {
    name: "BARBARA Classic Black Boxy Hoodie",
    slug: "barbara-classic-black-boxy-hoodie",
    description: "Hoodie bersiluet boxy dengan bahan fleece super tebal and lembut. Dilengkapi dengan tudung kepala ganda dan saku kanguru yang fungsional.",
    price: 549000,
    material: "Heavyweight Cotton Fleece 380 gsm",
    care: "Jangan gunakan mesin pengering. Cuci dengan putaran lambat.",
    categorySlug: "oversized-collection",
    collection: Collection.OVERSIZED_COLLECTION,
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
    categorySlug: "oversized-collection",
    collection: Collection.OVERSIZED_COLLECTION,
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
    categorySlug: "essentials",
    collection: Collection.ESSENTIALS,
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
    categorySlug: "graphic-tees",
    collection: Collection.GRAPHIC_TEES,
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
    categorySlug: "limited-edition",
    collection: Collection.LIMITED_EDITION,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1556821741-704ce4895446?w=800", alt: "Sand Hoodie Front", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },

  // --- JACKET (5) ---
  {
    name: "BARBARA Canvas Work Jacket",
    slug: "barbara-canvas-work-jacket",
    description: "Jaket bertipe workwear klasik dengan bahan kanvas kasar yang kuat. Dilengkapi dengan kerah corduroy berwarna coklat kontras dan furing hangat di bagian dalam.",
    price: 899000,
    material: "100% Heavy Duty Cotton Duck Canvas",
    care: "Cukup bersihkan noda kecil dengan sikat basah. Cuci kering (dry clean) untuk hasil terbaik.",
    categorySlug: "limited-edition",
    collection: Collection.LIMITED_EDITION,
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
    categorySlug: "best-sellers",
    collection: Collection.BEST_SELLERS,
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
    categorySlug: "new-arrivals",
    collection: Collection.NEW_ARRIVALS,
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
    categorySlug: "best-sellers",
    collection: Collection.BEST_SELLERS,
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
    categorySlug: "limited-edition",
    collection: Collection.LIMITED_EDITION,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", alt: "Leather Jacket Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },

  // --- SHIRT (5) ---
  {
    name: "BARBARA Flannel Heavyweight Plaid",
    slug: "barbara-flannel-heavyweight-plaid",
    description: "Kemeja flannel tebal dengan motif kotak-kotak klasik. Sangat cocok dipakai sebagai luaran (outer) di atas kaos basic.",
    price: 449000,
    material: "100% Heavy Flannel Cotton",
    care: "Cuci mesin dengan air dingin, jemur gantung, setrika dengan suhu hangat.",
    categorySlug: "best-sellers",
    collection: Collection.BEST_SELLERS,
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
    categorySlug: "oversized-collection",
    collection: Collection.OVERSIZED_COLLECTION,
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
    categorySlug: "essentials",
    collection: Collection.ESSENTIALS,
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
    categorySlug: "new-arrivals",
    collection: Collection.NEW_ARRIVALS,
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
    categorySlug: "new-arrivals",
    collection: Collection.NEW_ARRIVALS,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", alt: "Cuba Collar Shirt Front", order: 0 }
    ],
    colors: [
      { name: "White", hex: "#ffffff", skuCode: "WHT" },
      { name: "Navy", hex: "#000080", skuCode: "NVY" }
    ]
  },

  // --- PANTS (5) ---
  {
    name: "BARBARA Carpenter Canvas Double Knee",
    slug: "barbara-carpenter-canvas-double-knee",
    description: "Celana carpenter tangguh dengan panel double-knee di bagian lutut kaki. Dilengkapi gantungan palu khas workwear utilitas.",
    price: 649000,
    material: "12oz Premium Canvas Cotton",
    care: "Balik celana saat mencuci guna melindungi panel canvas lutut agar warna merata.",
    categorySlug: "limited-edition",
    collection: Collection.LIMITED_EDITION,
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
    categorySlug: "best-sellers",
    collection: Collection.BEST_SELLERS,
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
    categorySlug: "best-sellers",
    collection: Collection.BEST_SELLERS,
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
    categorySlug: "essentials",
    collection: Collection.ESSENTIALS,
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
    categorySlug: "new-arrivals",
    collection: Collection.NEW_ARRIVALS,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Tech Pants Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },

  // --- ACCESSORIES (6) ---
  {
    name: "BARBARA Beanie Ribbed Black",
    slug: "barbara-beanie-ribbed-black",
    description: "Kupluk beanie rajut tebal bertekstur ribbed. Sangat elastis dan pas di kepala untuk gaya urban street style.",
    price: 189000,
    material: "100% Soft Acrylic Knit Yarn",
    care: "Cuci dengan tangan secara lembut memakai air hangat hangat kuku agar tidak melar.",
    categorySlug: "essentials",
    collection: Collection.ESSENTIALS,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?w=800", alt: "Ribbed Beanie Front", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Canvas Tote Bag",
    slug: "barbara-canvas-tote-bag",
    description: "Tas jinjing (tote bag) kanvas tebal dengan sablon grafis BARBARA besar. Sempurna untuk membawa laptop, buku, dan perlengkapan harian.",
    price: 229000,
    material: "16oz Heavyweight Raw Canvas",
    care: "Cukup sikat bagian kotor secara lokal. Jangan direndam deterjen terlalu lama.",
    categorySlug: "graphic-tees",
    collection: Collection.GRAPHIC_TEES,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800", alt: "Canvas Tote Bag Front", order: 0 }
    ],
    colors: [
      { name: "White", hex: "#ffffff", skuCode: "WHT" }
    ]
  },
  {
    name: "BARBARA Metal Wallet Chain",
    slug: "barbara-metal-wallet-chain",
    description: "Rantai dompet logam kokoh bergaya punk industrial. Dilengkapi pengait double yang kuat untuk dipasang pada loop celana.",
    price: 149000,
    material: "Stainless Steel Hardware Alloy",
    care: "Cukup lap kering dengan kain lembut secara teratur agar bebas debu kelembaban.",
    categorySlug: "limited-edition",
    collection: Collection.LIMITED_EDITION,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?w=800", alt: "Wallet Chain View", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  },
  {
    name: "BARBARA Leather Utility Belt",
    slug: "barbara-leather-utility-belt",
    description: "Ikat pinggang kulit asli dengan gesper logam besi solid. Desain tangguh pelengkap celana jeans denim.",
    price: 299000,
    material: "100% Full-grain Pull Up Leather",
    care: "Hindari kontak basah langsung. Berikan krim khusus kulit berkala.",
    categorySlug: "essentials",
    collection: Collection.ESSENTIALS,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?w=800", alt: "Leather Belt View", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" }
    ]
  },
  {
    name: "BARBARA Embroidered Dad Cap",
    slug: "barbara-embroidered-dad-cap",
    description: "Topi baseball bergaya dad cap dengan bordir teks minimalis BARBARA di depan. Gesper logam kuningan di belakang memudahkan penyetelan ukuran.",
    price: 199000,
    material: "100% Washed Twill Cotton",
    care: "Bersihkan area keringat secara lokal memakai air sabun lembut, hindari sikat kasar di bordir.",
    categorySlug: "best-sellers",
    collection: Collection.BEST_SELLERS,
    isNew: false,
    images: [
      { url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800", alt: "Dad Cap Front View", order: 0 }
    ],
    colors: [
      { name: "Black", hex: "#000000", skuCode: "BLK" },
      { name: "Navy", hex: "#000080", skuCode: "NVY" }
    ]
  },
  {
    name: "BARBARA Silver Box Chain Necklace",
    slug: "barbara-silver-box-chain-necklace",
    description: "Kalung perak model box chain minimalis unisex. Cocok dipakai solo atau dikombinasikan dengan liontin custom kesukaan.",
    price: 249000,
    material: "925 Sterling Silver Plated Brass",
    care: "Simpan dalam kantong kedap udara saat tidak dipakai agar warna perak tahan lama.",
    categorySlug: "new-arrivals",
    collection: Collection.NEW_ARRIVALS,
    isNew: true,
    images: [
      { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800", alt: "Chain Necklace View", order: 0 }
    ],
    colors: [
      { name: "Grey", hex: "#808080", skuCode: "GRY" }
    ]
  }
];

const sizes = ["S", "M", "L", "XL"];

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

  // 3. Reassign products referencing old categories to Essentials to avoid foreign key violations, then delete old categories
  const activeCategoryIds = Object.values(categoryMap);
  const essentialsId = categoryMap["essentials"];
  if (essentialsId) {
    await prisma.product.updateMany({
      where: {
        categoryId: { notIn: activeCategoryIds }
      },
      data: {
        categoryId: essentialsId
      }
    });
    console.log("✓ Berhasil me-reassign produk dengan kategori lama ke 'Essentials'");
  }

  const { count: deletedCats } = await prisma.category.deleteMany({
    where: {
      id: { notIn: activeCategoryIds }
    }
  });
  if (deletedCats > 0) {
    console.log(`✓ Berhasil menghapus ${deletedCats} kategori lama/dummy.`);
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
