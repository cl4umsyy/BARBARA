"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
  Globe,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Tags,
} from "lucide-react";

interface AdminSidebarProps {
  session: Session;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ session }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Package,
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Tags,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ClipboardList,
    },
    {
      name: "Reviews",
      href: "/admin/reviews",
      icon: MessageSquare,
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: window.location.origin });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-brand-black text-brand-white p-6 font-sans">
      <div>
        {/* Brand/Logo */}
        <div className="mb-10 px-2 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-2xl font-black uppercase tracking-wider text-brand-white"
          >
            barbara adm
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-brand-gray-light hover:text-brand-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 py-3.5 px-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-xl border-l-2 ${
                  isActive
                    ? "bg-brand-dark border-brand-white text-brand-white"
                    : "border-transparent text-brand-gray-light hover:bg-brand-dark hover:text-brand-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Footer Actions */}
      <div className="border-t border-brand-dark pt-6 space-y-4">
        {/* User Profile */}
        <div className="px-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-white text-brand-black flex items-center justify-center font-black text-xs">
            {session.user.name?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate tracking-wider uppercase">
              {session.user.name ?? "Admin"}
            </p>
            <p className="text-[10px] text-brand-gray-light truncate">
              {session.user.email}
            </p>
          </div>
        </div>

        {/* Global Links */}
        <div className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-4 py-2 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-gray-light hover:text-brand-white transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 py-2 px-4 text-[10px] font-bold uppercase tracking-widest text-brand-gray-light hover:text-brand-white transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-brand-black text-brand-white flex items-center justify-between px-4 border-b border-brand-dark font-sans">
        <Link
          href="/admin"
          className="text-lg font-black uppercase tracking-wider text-brand-white"
        >
          barbara adm
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-brand-white hover:opacity-80 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20 border-r border-brand-dark">
        <SidebarContent />
      </aside>

      {/* Spacer for desktop sidebar layout */}
      <div className="hidden md:block md:w-64 md:shrink-0" />

      {/* Spacer for mobile fixed header */}
      <div className="md:hidden h-16 w-full" />

      {/* Mobile Drawer (Overlay) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-64 max-w-xs flex-1 flex flex-col bg-brand-black transition-transform duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};
