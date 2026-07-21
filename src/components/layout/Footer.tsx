"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Hide Footer for admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full border-t border-brand-light bg-brand-white py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-brand-black">
              barbara
            </h4>
            <p className="text-xs text-brand-gray leading-relaxed max-w-xs">
              Contemporary unisex fashion. Bold, edgy, and pure monochrome.
              Redefining streetwear standards.
            </p>
          </div>

          {/* Links: Shop */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-black">
              Koleksi
            </h5>
            <Link
              href="/shop"
              className="text-xs text-brand-gray hover:text-brand-black transition-colors"
            >
              Semua Produk
            </Link>
            <Link
              href="/shop?category=tops"
              className="text-xs text-brand-gray hover:text-brand-black transition-colors"
            >
              Tops
            </Link>
            <Link
              href="/shop?category=bottoms"
              className="text-xs text-brand-gray hover:text-brand-black transition-colors"
            >
              Bottoms
            </Link>
            <Link
              href="/shop?category=outerwear"
              className="text-xs text-brand-gray hover:text-brand-black transition-colors"
            >
              Outerwear
            </Link>
          </div>

          {/* Links: About */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-black">
              Perusahaan
            </h5>
            <Link
              href="/about"
              className="text-xs text-brand-gray hover:text-brand-black transition-colors"
            >
              Tentang Kami
            </Link>
            <Link
              href="/contact"
              className="text-xs text-brand-gray hover:text-brand-black transition-colors"
            >
              Hubungi Kami
            </Link>
          </div>

          {/* Social Media */}
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-black">
              Ikuti Kami
            </h5>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-gray hover:text-brand-black transition-colors uppercase font-bold tracking-wider"
              >
                Instagram
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-gray hover:text-brand-black transition-colors uppercase font-bold tracking-wider"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-light mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-wider text-brand-gray-light font-bold">
            &copy; {new Date().getFullYear()} barbara. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-[10px] uppercase tracking-wider text-brand-gray-light hover:text-brand-black transition-colors font-bold"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[10px] uppercase tracking-wider text-brand-gray-light hover:text-brand-black transition-colors font-bold"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
