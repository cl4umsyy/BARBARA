"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function PageTitleSyncContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    if (pathname === "/") {
      document.title = "BARBARA | Home";
    } else if (pathname === "/about") {
      document.title = "BARBARA | Tentang";
    } else if (pathname === "/contact") {
      document.title = "BARBARA | Kontak";
    } else if (pathname === "/collections") {
      document.title = "BARBARA | Semua Koleksi";
    } else if (pathname === "/cart") {
      document.title = "BARBARA | Keranjang";
    } else if (pathname === "/favorit") {
      document.title = "BARBARA | Wishlist";
    } else if (pathname === "/checkout") {
      document.title = "BARBARA | Checkout";
    } else if (pathname.startsWith("/admin")) {
      document.title = "BARBARA | Dashboard Admin";
    } else if (pathname === "/orders") {
      document.title = "BARBARA | Pesanan Saya";
    } else if (pathname === "/profile") {
      const tab = searchParams.get("tab");
      if (tab === "orders") {
        document.title = "BARBARA | Pesanan Saya";
      } else if (tab === "addresses") {
        document.title = "BARBARA | Alamat Pengiriman";
      } else if (tab === "favorites") {
        document.title = "BARBARA | Wishlist";
      } else if (tab === "security") {
        document.title = "BARBARA | Keamanan Akun";
      } else {
        document.title = "BARBARA | Profil Saya";
      }
    } else if (pathname === "/shop") {
      const gender = (searchParams.get("gender") || "").toLowerCase();
      if (gender === "pria") {
        document.title = "BARBARA | Pria";
      } else if (gender === "wanita") {
        document.title = "BARBARA | Wanita";
      } else {
        document.title = "BARBARA | Katalog Produk";
      }
    }
  }, [pathname, searchParams]);

  return null;
}

export function PageTitleSync() {
  return (
    <Suspense fallback={null}>
      <PageTitleSyncContent />
    </Suspense>
  );
}
