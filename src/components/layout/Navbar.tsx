"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { Search, ShoppingBag, User, X, LogOut, Menu, Heart } from "lucide-react";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const cartCount = useCartStore((state) => state.getCartCount());
  const openModal = useAuthModalStore((s) => s.openModal);
  const favoriteCount = useFavoriteStore((s) => s.count);
  const fetchFavorites = useFavoriteStore((s) => s.fetchFavorites);
  const isFavLoaded = useFavoriteStore((s) => s.isLoaded);

  const [hasMounted, setHasMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch favorites when user logs in
  useEffect(() => {
    if (session?.user && !isFavLoaded) {
      fetchFavorites();
    }
  }, [session?.user, isFavLoaded, fetchFavorites]);

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
    { name: "Sale", href: "/shop?sale=true", isSale: true },
    { name: "Tentang", href: "/about" },
    { name: "Kontak", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-light bg-brand-white/90 backdrop-blur-md">
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

            {/* Profile Dropdown / Login & Register buttons */}
            {hasMounted && (
              session?.user ? (
                <div className="relative">
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
                <>
                  {/* Desktop Auth Buttons */}
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
                  {/* Mobile Auth Button (Icon Only) */}
                  <button
                    type="button"
                    id="navbar-signin-btn-mobile"
                    onClick={() => openModal("login")}
                    className="md:hidden p-2 text-brand-black hover:opacity-75 transition-opacity cursor-pointer"
                    aria-label="Login"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </>
              )
            )}

          </div>
        </div>

        {/* Sub Navigation (Row 2 - Desktop Only) */}
        <div className="hidden md:flex h-12 items-center justify-center gap-8 text-xs font-bold uppercase tracking-widest text-brand-black">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={
                link.isSale
                  ? "text-red-600 hover:text-red-700 font-extrabold tracking-[0.15em] transition-colors"
                  : "hover:opacity-75 transition-opacity"
              }
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Drawer Content */}
          <div className="relative w-4/5 max-w-sm bg-brand-white h-full p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-brand-light pb-4">
              <span className="text-lg font-black uppercase tracking-wider">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-brand-black hover:opacity-70"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#F5F5F5] rounded-xl px-4 py-2 w-full">
              <Search className="w-4 h-4 text-brand-gray mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-medium outline-none text-brand-black placeholder-brand-gray-light w-full"
              />
            </form>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-5 text-sm font-bold uppercase tracking-widest text-brand-black mt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={
                    link.isSale
                      ? "text-red-600 hover:text-red-700 font-extrabold tracking-[0.15em]"
                      : "hover:opacity-70 transition-opacity"
                  }
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Actions */}
            <div className="mt-auto border-t border-brand-light pt-6 flex flex-col gap-4">
              {hasMounted && (
                session?.user ? (
                  <div className="flex flex-col gap-3">
                    <div className="px-2 flex items-center gap-3 pb-3 border-b border-brand-light/50 mb-1">
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
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-xs font-bold uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity px-2 py-1"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile?tab=profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs font-bold uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity px-2 py-1"
                    >
                      Profil Saya
                    </Link>
                    {session.user.role !== "ADMIN" && (
                      <Link
                        href="/profile?tab=orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-xs font-bold uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity px-2 py-1"
                      >
                        Pesanan Saya
                      </Link>
                    )}
                    {session.user.role !== "ADMIN" && (
                      <Link
                        href="/favorit"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-xs font-bold uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity px-2 py-1 flex items-center gap-2"
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
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:opacity-70 transition-opacity px-2 py-1 text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openModal("login");
                      }}
                      className="w-full text-center font-bold uppercase tracking-[0.15em] text-xs py-3 border border-brand-black text-brand-black rounded-xl hover:bg-brand-light transition-all cursor-pointer"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openModal("register");
                      }}
                      className="w-full text-center font-black uppercase tracking-[0.15em] text-xs py-3 bg-brand-black text-brand-white rounded-xl hover:opacity-90 transition-all cursor-pointer"
                    >
                      Daftar
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
