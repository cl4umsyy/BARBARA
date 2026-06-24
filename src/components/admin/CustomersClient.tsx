"use client";

import React, { useState } from "react";
import { Search, Calendar, ShoppingBag, Users, ArrowUpDown, User, CircleDollarSign } from "lucide-react";

interface Order {
  id: string;
  total: any; // Decimal type maps to string/number
  paymentStatus: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  avatarUrl: string | null;
  orders: Order[];
}

interface CustomersClientProps {
  initialCustomers: Customer[];
}

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(dateStr));
};

export const CustomersClient: React.FC<CustomersClientProps> = ({ initialCustomers }) => {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Process customer stats
  const totalCustomers = initialCustomers.length;
  
  // Total overall revenue from all paid orders
  const totalSpendAll = initialCustomers.reduce((totalAcc, cust) => {
    const custPaidTotal = cust.orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((oAcc, o) => oAcc + Number(o.total), 0);
    return totalAcc + custPaidTotal;
  }, 0);

  // Total paid orders count
  const totalPaidOrders = initialCustomers.reduce((acc, cust) => {
    return acc + cust.orders.filter((o) => o.paymentStatus === "PAID").length;
  }, 0);

  // 2. Filter & Search
  const filteredCustomers = initialCustomers.filter((c) => {
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term);
  });

  // 3. Sort
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  // 4. Pagination
  const totalFiltered = sortedCustomers.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);

  // Reset pagination on search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gray-light">
          Admin Panel
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-wider md:text-4xl text-brand-black">
          Customers
        </h1>
        <p className="text-sm text-brand-gray-light mt-1">
          Kelola direktori pelanggan terdaftar dan pantau riwayat belanja mereka secara real-time.
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Customers */}
        <div className="bg-brand-white border border-brand-light p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">
              Total Customer
            </span>
            <span className="text-3xl font-black text-brand-black mt-1 block">
              {totalCustomers}
            </span>
          </div>
        </div>

        {/* Card 2: Total Paid Orders */}
        <div className="bg-brand-white border border-brand-light p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand-black">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">
              Total Pembelian Sukses
            </span>
            <span className="text-3xl font-black text-brand-black mt-1 block">
              {totalPaidOrders} <span className="text-xs text-brand-gray-light font-bold">Pesanan</span>
            </span>
          </div>
        </div>

        {/* Card 3: Total Spends */}
        <div className="bg-brand-white border border-brand-light p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand-black">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">
              Akumulasi Omzet Belanja
            </span>
            <span className="text-xl md:text-2xl font-black text-brand-black mt-1.5 block">
              {formatIDR(totalSpendAll)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Actions Section */}
      <div className="bg-[#fbfbfb] border border-brand-light p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-brand-gray-light" />
          <input
            type="text"
            placeholder="Cari customer berdasarkan nama atau email..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-brand-white border border-brand-light px-11 py-3 text-xs font-semibold rounded-xl focus:border-brand-black transition-all outline-none"
          />
        </div>

        {/* Sorting Action */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-2 px-4 py-3 bg-brand-white border border-brand-light hover:border-brand-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Urutan: {sortOrder === "newest" ? "Terbaru" : "Terlama"}</span>
          </button>
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-gray-light whitespace-nowrap">
            {totalFiltered} Customer ditemukan
          </div>
        </div>
      </div>

      {/* Customers Table Card */}
      <div className="border border-brand-light bg-brand-white p-6 md:p-8 rounded-2xl shadow-sm">
        {currentItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <Users className="w-12 h-12 text-brand-gray-light/50" />
            <div className="text-xs font-bold uppercase tracking-widest text-brand-gray-light">
              {search ? "Customer tidak ditemukan." : "Belum ada customer terdaftar di database."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-light text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  <th className="pb-4 pr-3">Profil</th>
                  <th className="pb-4 pr-3">Kontak & Email</th>
                  <th className="pb-4 pr-3">Nomor Telepon</th>
                  <th className="pb-4 pr-3">Registrasi</th>
                  <th className="pb-4 pr-3 text-center">Total Pesanan</th>
                  <th className="pb-4 pr-3 text-right">Total Belanja</th>
                  <th className="pb-4 pr-3 text-center">Status Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {currentItems.map((c) => {
                  const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID");
                  const totalOrdersCount = paidOrders.length;
                  const totalSpendAmount = paidOrders.reduce((acc, o) => acc + Number(o.total), 0);

                  return (
                    <tr key={c.id} className="group hover:bg-[#fcfcfc] transition-colors">
                      {/* Avatar & Name */}
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-3">
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className="w-10 h-10 rounded-full object-cover border border-brand-light"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-black text-brand-white flex items-center justify-center font-black text-xs uppercase border border-brand-light">
                              {c.name.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-brand-black leading-tight">
                              {c.name}
                            </p>
                            <p className="text-[9px] font-mono text-brand-gray-light mt-0.5 select-all">
                              ID: {c.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email & Contact */}
                      <td className="py-4 pr-3">
                        <p className="text-xs font-bold text-brand-black">{c.email}</p>
                      </td>

                      {/* Phone Number */}
                      <td className="py-4 pr-3">
                        <span className="text-xs font-medium text-brand-gray">
                          {c.phone || "-"}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 pr-3">
                        <p className="text-xs font-medium text-brand-gray flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-gray-light shrink-0" />
                          <span>{formatDate(c.createdAt)}</span>
                        </p>
                      </td>

                      {/* Total Orders */}
                      <td className="py-4 pr-3 text-center">
                        <span className={`inline-block px-2.5 py-1 text-xs font-black rounded-lg ${
                          totalOrdersCount > 0 ? "bg-brand-light text-brand-black" : "text-brand-gray-light/60 font-bold"
                        }`}>
                          {totalOrdersCount}
                        </span>
                      </td>

                      {/* Total Spends */}
                      <td className="py-4 pr-3 text-right">
                        <span className={`text-xs font-black ${
                          totalSpendAmount > 0 ? "text-brand-black" : "text-brand-gray-light/60 font-bold"
                        }`}>
                          {totalSpendAmount > 0 ? formatIDR(totalSpendAmount) : "-"}
                        </span>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-4 pr-3 text-center">
                        <span className="inline-block px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-green-50 text-green-700 border border-green-200">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-brand-light mt-8 pt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-brand-light hover:border-brand-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:hover:border-brand-light"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-brand-gray-light uppercase tracking-wider">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-brand-light hover:border-brand-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:hover:border-brand-light"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
