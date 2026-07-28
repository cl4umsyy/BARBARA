"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSafeSession } from "@/lib/useSafeSession";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { Search, ShoppingBag, User, X, LogOut, Menu, Heart } from "lucide-react";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSafeSession();
  const cartCount = useCartStore((state) => state.getCartCount());
  const openModal = useAuthModalStore((s) => s.openModal);
  const favoriteCount = useFavoriteStore((s) => s.count);
  const fetchFavorites = useFavoriteStore((s) => s.fetchFavorites);
  const isFavLoaded = useFavoriteStore((s) => s.isLoaded);

  const [hasMounted, setHasMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Smart sticky header scroll listener (hide on scroll down, show on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show header near top of page
      if (currentScrollY <= 20) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 3) {
        // Scrolling down -> hide header
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 3) {
        // Scrolling up -> show header
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch favorites when user logs in
  useEffect(() => {
    if (session?.user && !isFavLoaded) {
      fetchFavorites();
    }
  }, [session?.user, isFavLoaded, fetchFavorites]);

  // Prevent background scroll ONLY when mobile menu is active and mounted
  useEffect(() => {
    if (isMobileMenuOpen && hasMounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, hasMounted]);

  // Close mobile menu on pathname change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  console.log(
    `[Navbar Render] path: ${pathname}, status: ${status}, hasMounted: ${hasMounted}, hasUser: ${!!session?.user}, email: ${session?.user?.email ?? "none"}`
  );

  useEffect(() => {
    if (session?.user) {
      console.log("[DEBUG][Navbar] User logged in. Avatar URL from session:", session.user.image);
    }
  }, [session]);

  // Hide Navbar for admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: "Pria", href: "/shop?gender=pria" },
    { name: "Wanita", href: "/shop?gender=wanita" },
    { name: "Tentang", href: "/about" },
    { name: "Kontak", href: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-brand-light bg-brand-white/90 backdrop-blur-md transition-transform duration-300 ease-in-out ${
        isVisible || isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
        {/* Main Header (Row 1) */}
        <div className="flex h-20 items-center justify-between gap-4 border-b border-brand-light/30">
          
          {/* Mobile Menu Toggle (Left on mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-brand-black hover:opacity-75 transition-opacity cursor-pointer"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-black uppercase tracking-wider text-brand-black transition-opacity hover:opacity-80 flex-shrink-0"
          >
            barbara
          </Link>

          {/* Centered Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center bg-[#F5F5F5] rounded-xl px-4 py-2 w-80 lg:w-[450px] border border-transparent focus-within:border-brand-black transition-colors"
          >
            <Search className="w-4 h-4 text-brand-gray mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari produk barbara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-medium tracking-wide outline-none text-brand-black placeholder-brand-gray-light w-full"
            />
          </form>

          {/* Action Icons (Right) */}
          <div className="flex items-center gap-4">

            {/* Favorit Icon */}
            {hasMounted && (
              session?.user ? (
                <Link
                  href="/favorit"
                  className="relative p-2 text-brand-black hover:opacity-75 transition-opacity"
                  aria-label="Favorit"
                >
                  <Heart className="w-5 h-5" />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-red-500 text-[9px] font-black text-brand-white rounded-full">
                      {favoriteCount}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => openModal("login")}
                  className="relative p-2 text-brand-black hover:opacity-75 transition-opacity cursor-pointer"
                  aria-label="Favorit"
                >
                  <Heart className="w-5 h-5" />
                </button>
              )
            )}

            {/* Cart Icon */}
            {hasMounted && session?.user && (
              <Link
                href="/cart"
                className="relative p-2 text-brand-black hover:opacity-75 transition-opacity"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-brand-black text-[9px] font-black text-brand-white rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Profile Dropdown / Desktop Auth Buttons (Desktop Only) */}
            {hasMounted && (
              session?.user ? (
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="p-1 text-brand-black hover:opacity-75 transition-opacity cursor-pointer flex items-center gap-2"
                    aria-label="User Account"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Avatar"}
                        className="w-9 h-9 rounded-full object-cover border border-brand-light"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-black text-brand-white flex items-center justify-center font-black text-xs uppercase border border-brand-light">
                        {(session.user.name || session.user.email || "US").substring(0, 2)}
                      </div>
                    )}
                    {session.user.name && (
                      <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                        {session.user.name}
                      </span>
                    )}
                  </button>

                  {isProfileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 z-50 w-56 bg-brand-white border border-brand-light py-2 shadow-xl rounded-xl">
                        <div className="flex flex-col">
                          <div className="px-4 py-2 border-b border-brand-light">
                            <p className="text-[10px] uppercase tracking-wider text-brand-gray-light font-bold">
                              Logged in as
                            </p>
                            <p className="text-xs font-bold truncate text-brand-black">
                              {session.user.name || session.user.email}
                            </p>
                          </div>
                          {session.user.role === "ADMIN" && (
                            <Link
                              href="/admin"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light transition-colors"
                            >
                              Admin Dashboard
                            </Link>
                          )}
                          <Link
                            href="/profile?tab=profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light transition-colors"
                          >
                            Profil Saya
                          </Link>
                          {session.user.role !== "ADMIN" && (
                            <Link
                              href="/profile?tab=orders"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light transition-colors"
                            >
                              Pesanan Saya
                            </Link>
                          )}
                          {session.user.role !== "ADMIN" && (
                            <Link
                              href="/favorit"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light transition-colors flex items-center gap-2"
                            >
                              <Heart className="w-3.5 h-3.5" />
                              Favorit
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              signOut({ callbackUrl: window.location.origin });
                            }}
                            className="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light transition-colors w-full text-left cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    type="button"
                    id="navbar-signin-btn"
                    onClick={() => openModal("login")}
                    className="text-xs font-bold uppercase tracking-wider text-brand-black hover:opacity-75 transition-opacity px-3 py-2 cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    id="navbar-register-btn"
                    onClick={() => openModal("register")}
                    className="text-xs font-black uppercase tracking-wider bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black border border-brand-black transition-all px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    Daftar
                  </button>
                </div>
              )
            )}

          </div>
        </div>

        {/* Sub Navigation (Row 2 - Desktop Only) */}
        <div className="hidden md:flex h-12 items-center justify-center gap-10 lg:gap-14 text-xs font-bold uppercase tracking-widest text-brand-black">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:opacity-75 transition-opacity"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Full Screen Solid Menu Container & Overlay (Portal) */}
      {hasMounted && isMobileMenuOpen && createPortal(
        <div 
          className="fixed inset-0 top-0 left-0 w-full h-full h-[100dvh] z-[9999] md:hidden bg-brand-white text-brand-black flex flex-col overflow-y-auto"
          style={{ backgroundColor: "var(--color-brand-white, #ffffff)" }}
        >
          {/* Menu Top Header Bar */}
          <div 
            className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-brand-light bg-brand-white"
            style={{ backgroundColor: "var(--color-brand-white, #ffffff)" }}
          >
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xl font-black uppercase tracking-wider text-brand-black"
            >
              barbara
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 -mr-2 text-brand-black hover:opacity-75 transition-opacity cursor-pointer rounded-full"
              aria-label="Close Mobile Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Main Content */}
          <div className="flex-1 p-6 flex flex-col gap-6">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#F5F5F5] rounded-xl px-4 py-3 w-full border border-transparent focus-within:border-brand-black transition-colors">
              <Search className="w-4 h-4 text-brand-gray mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari produk barbara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm font-medium tracking-wide outline-none text-brand-black placeholder-brand-gray-light w-full"
              />
            </form>

            {/* Navigation Links */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-gray-light mb-1 px-1">
                Navigasi
              </span>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-widest text-brand-black hover:bg-[#F5F5F5] transition-colors flex items-center justify-between"
                  >
                    <span>{link.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Auth / Account Section at Bottom */}
            <div className="mt-auto pt-6 border-t border-brand-light flex flex-col gap-4">
              {hasMounted && (
                session?.user ? (
                  <div className="flex flex-col gap-3 bg-[#F9F9F9] p-4 rounded-2xl border border-brand-light">
                    <div className="flex items-center gap-3 pb-3 border-b border-brand-light/60">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || "Avatar"}
                          className="w-10 h-10 rounded-full object-cover border border-brand-light"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-black text-brand-white flex items-center justify-center font-black text-xs uppercase border border-brand-light">
                          {(session.user.name || session.user.email || "US").substring(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Logged in as
                        </p>
                        <p className="text-xs font-bold truncate text-brand-black">
                          {session.user.name || session.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {session.user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light rounded-lg transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        href="/profile?tab=profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light rounded-lg transition-colors"
                      >
                        Profil Saya
                      </Link>
                      {session.user.role !== "ADMIN" && (
                        <Link
                          href="/profile?tab=orders"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light rounded-lg transition-colors"
                        >
                          Pesanan Saya
                        </Link>
                      )}
                      {session.user.role !== "ADMIN" && (
                        <Link
                          href="/favorit"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-brand-black hover:bg-brand-light rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          Favorit
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          signOut({ callbackUrl: window.location.origin });
                        }}
                        className="flex items-center gap-2 py-2 px-3 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left cursor-pointer mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openModal("login");
                      }}
                      className="w-full text-center font-bold uppercase tracking-[0.15em] text-xs py-3.5 border border-brand-black text-brand-black rounded-xl hover:bg-brand-light transition-all cursor-pointer"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openModal("register");
                      }}
                      className="w-full text-center font-black uppercase tracking-[0.15em] text-xs py-3.5 bg-brand-black text-brand-white rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-md"
                    >
                      Daftar
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
