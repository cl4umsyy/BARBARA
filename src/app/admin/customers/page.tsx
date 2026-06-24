import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CustomersClient } from "@/components/admin/CustomersClient";
import { ShopErrorFallback } from "@/components/shop/ShopErrorFallback";

export const revalidate = 0; // Disable caching to fetch fresh customers data

export default async function AdminCustomersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/customers");
  }

  let customers: any[] = [];
  let dbError: any = null;

  try {
    customers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            paymentStatus: true,
          },
        },
      },
    });
  } catch (err: any) {
    console.error("[AdminCustomersPage Server] Database connection error:", err);
    dbError = err;
  }

  if (dbError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16">
        <ShopErrorFallback
          error={dbError.message || String(dbError)}
          code="ADMIN_CUSTOMERS_DB_ERROR"
          title="Direktori Pelanggan Terganggu"
          message="Gagal memuat daftar pelanggan dari database karena kesalahan koneksi berikut:"
        />
      </div>
    );
  }

  // Format data for Client Component (serializing Date & Decimal objects)
  const formattedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || null,
    createdAt: c.createdAt.toISOString(),
    avatarUrl: c.avatarUrl || null,
    orders: c.orders.map((o: any) => ({
      id: o.id,
      total: Number(o.total),
      paymentStatus: o.paymentStatus,
    })),
  }));

  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light font-sans bg-brand-white border border-brand-light rounded-2xl">
          Memuat Daftar Pelanggan...
        </div>
      }
    >
      <CustomersClient initialCustomers={formattedCustomers} />
    </React.Suspense>
  );
}
