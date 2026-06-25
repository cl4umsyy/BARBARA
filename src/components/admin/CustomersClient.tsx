"use client";

import React, { useState } from "react";
import { 
  Search, 
  Calendar, 
  ShoppingBag, 
  Users, 
  ArrowUpDown, 
  User as UserIcon, 
  CircleDollarSign, 
  Plus, 
  MoreHorizontal, 
  Shield, 
  Lock, 
  Trash2, 
  Ban, 
  CheckCircle,
  Eye,
  Edit,
  Loader2,
  X
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Order {
  id: string;
  total: number;
  paymentStatus: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  avatarUrl: string | null;
  orders: Order[];
}

interface CustomersClientProps {
  initialCustomers: Customer[];
  currentUserId: string;
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
    timeStyle: "short",
  }).format(new Date(dateStr));
};

export const CustomersClient: React.FC<CustomersClientProps> = ({ 
  initialCustomers,
  currentUserId 
}) => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dropdown action menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Selected customer for modal operations
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);

  // Form input states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Add User Form State
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "USER"
  });

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  // Role Form State
  const [roleForm, setRoleForm] = useState({
    role: "USER"
  });

  // Password Reset Form State
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: ""
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Stats calculation
  const totalUsersCount = customers.length;
  const adminsCount = customers.filter(c => c.role === "ADMIN").length;
  const activeUsersCount = customers.filter(c => c.isActive).length;
  const inactiveUsersCount = customers.filter(c => !c.isActive).length;

  // Filter & Search
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.email.toLowerCase().includes(search.toLowerCase()) ||
                          (c.phone && c.phone.includes(search));
    const matchesRole = roleFilter === "ALL" || c.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Sort
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  // Pagination
  const totalFiltered = sortedCustomers.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (filter: "ALL" | "USER" | "ADMIN") => {
    setRoleFilter(filter);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
    setCurrentPage(1);
  };

  const toggleActionMenu = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(prev => (prev === userId ? null : userId));
  };

  // ─── API Operations ──────────────────────────────────────────────────────

  // 1. CREATE USER
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (addForm.password !== addForm.confirmPassword) {
      setFormError("Password dan konfirmasi password tidak cocok.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (res.ok) {
        // Append new user to local list
        const newUser: Customer = {
          ...data.user,
          createdAt: new Date().toISOString(),
          avatarUrl: null,
          orders: [],
          phone: addForm.phone || null,
          isActive: true
        };
        setCustomers(prev => [newUser, ...prev]);
        showToast(data.message || "User baru berhasil dibuat.");
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          role: "USER"
        });
      } else {
        setFormError(data.error || "Gagal membuat user.");
      }
    } catch (err) {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. EDIT USER INFO
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          ...editForm
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(prev => prev.map(c => c.id === selectedUser.id ? { ...c, ...data.user, phone: editForm.phone || null } : c));
        showToast(data.message || "Profil user berhasil diperbarui.");
        setIsEditModalOpen(false);
      } else {
        setFormError(data.error || "Gagal memperbarui profil.");
      }
    } catch (err) {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. CHANGE ROLE
  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          role: roleForm.role
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(prev => prev.map(c => c.id === selectedUser.id ? { ...c, role: data.user.role } : c));
        showToast(data.message || "Role user berhasil diperbarui.");
        setIsRoleModalOpen(false);
      } else {
        setFormError(data.error || "Gagal mengubah role.");
      }
    } catch (err) {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setIsSubmitting(true);

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setFormError("Password dan konfirmasi password tidak cocok.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          password: passwordForm.password,
          confirmPassword: passwordForm.confirmPassword
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Password user berhasil di-reset.");
        setIsPasswordModalOpen(false);
        setPasswordForm({ password: "", confirmPassword: "" });
      } else {
        setFormError(data.error || "Gagal me-reset password.");
      }
    } catch (err) {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. TOGGLE ACTIVE/INACTIVE
  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setFormError("");

    const targetStatus = !selectedUser.isActive;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          isActive: targetStatus
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(prev => prev.map(c => c.id === selectedUser.id ? { ...c, isActive: data.user.isActive } : c));
        showToast(data.message || `User berhasil ${targetStatus ? "diaktifkan" : "dinonaktifkan"}.`);
        setIsStatusConfirmOpen(false);
      } else {
        showToast(data.error || "Gagal mengubah status akun.", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. DELETE USER
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== selectedUser.id));
        showToast(data.message || "User berhasil dihapus secara permanen.");
        setIsDeleteConfirmOpen(false);
      } else {
        showToast(data.error || "Gagal menghapus user.", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal launchers
  const openEdit = (user: Customer) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || "" });
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const openDetail = (user: Customer) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
    setActiveMenuId(null);
  };

  const openRole = (user: Customer) => {
    setSelectedUser(user);
    setRoleForm({ role: user.role });
    setIsRoleModalOpen(true);
    setActiveMenuId(null);
  };

  const openPassword = (user: Customer) => {
    setSelectedUser(user);
    setPasswordForm({ password: "", confirmPassword: "" });
    setIsPasswordModalOpen(true);
    setActiveMenuId(null);
  };

  const openStatusConfirm = (user: Customer) => {
    setSelectedUser(user);
    setIsStatusConfirmOpen(true);
    setActiveMenuId(null);
  };

  const openDeleteConfirm = (user: Customer) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-8 font-sans pb-16 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 text-brand-white border px-6 py-4 rounded-xl shadow-xl flex items-center gap-2 animate-slide-in ${
          toast.type === "success" ? "bg-brand-black border-brand-light/35" : "bg-red-950 border-red-800"
        }`}>
          <p className="text-xs font-bold uppercase tracking-wider">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gray-light">
            Admin Panel
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-wider md:text-4xl text-brand-black">
            Direktori Users
          </h1>
          <p className="text-sm text-brand-gray-light mt-1">
            Kelola data akun pengguna, hak akses admin, status keaktifan akun, serta pantau belanja pelanggan secara real-time.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-brand-black text-brand-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 hover:bg-brand-white hover:text-brand-black border border-brand-black transition-all duration-300 rounded-xl cursor-pointer w-full sm:w-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Users */}
        <div className="bg-brand-white border border-brand-light p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">
              Total User
            </span>
            <span className="text-3xl font-black text-brand-black mt-1 block">
              {totalUsersCount}
            </span>
          </div>
        </div>

        {/* Card 2: Total Admin */}
        <div className="bg-brand-white border border-brand-light p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand-black">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">
              Total Admin
            </span>
            <span className="text-3xl font-black text-brand-black mt-1 block">
              {adminsCount}
            </span>
          </div>
        </div>

        {/* Card 3: Total Active */}
        <div className="bg-brand-white border border-brand-light p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">
              User Aktif
            </span>
            <span className="text-3xl font-black text-green-700 mt-1 block">
              {activeUsersCount}
            </span>
          </div>
        </div>

        {/* Card 4: Total Inactive */}
        <div className="bg-brand-white border border-brand-light p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">
              User Nonaktif
            </span>
            <span className="text-3xl font-black text-red-700 mt-1 block">
              {inactiveUsersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Actions Section */}
      <div className="bg-[#fbfbfb] border border-brand-light p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-brand-gray-light" />
          <input
            type="text"
            placeholder="Cari user berdasarkan nama, email, atau telepon..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-brand-white border border-brand-light px-11 py-3 text-xs font-semibold rounded-xl focus:border-brand-black transition-all outline-none"
          />
        </div>

        {/* Role Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Role filter tab selectors */}
          <div className="flex border border-brand-light rounded-xl overflow-hidden bg-brand-white">
            <button
              onClick={() => handleRoleFilterChange("ALL")}
              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-wider cursor-pointer border-r border-brand-light transition-colors ${
                roleFilter === "ALL" ? "bg-brand-black text-brand-white" : "hover:bg-brand-light/40 text-brand-black"
              }`}
            >
              Semua User
            </button>
            <button
              onClick={() => handleRoleFilterChange("ADMIN")}
              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-wider cursor-pointer border-r border-brand-light transition-colors ${
                roleFilter === "ADMIN" ? "bg-brand-black text-brand-white" : "hover:bg-brand-light/40 text-brand-black"
              }`}
            >
              Hanya Admin
            </button>
            <button
              onClick={() => handleRoleFilterChange("USER")}
              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                roleFilter === "USER" ? "bg-brand-black text-brand-white" : "hover:bg-brand-light/40 text-brand-black"
              }`}
            >
              Hanya User
            </button>
          </div>

          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-white border border-brand-light hover:border-brand-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Urutan: {sortOrder === "newest" ? "Terbaru" : "Terlama"}</span>
          </button>
        </div>
      </div>

      {/* Customers Table Card */}
      <div className="border border-brand-light bg-brand-white p-6 md:p-8 rounded-2xl shadow-sm">
        {currentItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <Users className="w-12 h-12 text-brand-gray-light/50" />
            <div className="text-xs font-bold uppercase tracking-widest text-brand-gray-light">
              {search ? "User tidak ditemukan." : "Belum ada user terdaftar di database."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-brand-light text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  <th className="pb-4 pr-3">Profil</th>
                  <th className="pb-4 pr-3">Email</th>
                  <th className="pb-4 pr-3">Nomor Telepon</th>
                  <th className="pb-4 pr-3 text-center">Role</th>
                  <th className="pb-4 pr-3">Registrasi</th>
                  <th className="pb-4 pr-3 text-center">Total Pesanan</th>
                  <th className="pb-4 pr-3 text-right">Total Belanja</th>
                  <th className="pb-4 pr-3 text-center">Status Akun</th>
                  <th className="pb-4 pr-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {currentItems.map((c) => {
                  const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID");
                  const totalOrdersCount = paidOrders.length;
                  const totalSpendAmount = paidOrders.reduce((acc, o) => acc + Number(o.total), 0);

                  const isSelf = c.id === currentUserId;

                  return (
                    <tr key={c.id} className="group hover:bg-[#fcfcfc] transition-colors relative">
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
                            <div className="w-10 h-10 rounded-full bg-brand-black text-brand-white flex items-center justify-center font-black text-xs uppercase border border-brand-light shrink-0">
                              {c.name.substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-brand-black leading-tight truncate max-w-[150px]">
                              {c.name} {isSelf && <span className="text-[9px] text-brand-gray-light lowercase font-medium italic border border-brand-light px-1 py-0.5 rounded-md">(anda)</span>}
                            </p>
                            <p className="text-[9px] font-mono text-brand-gray-light mt-0.5 select-all truncate max-w-[150px]">
                              ID: {c.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 pr-3">
                        <p className="text-xs font-bold text-brand-black">{c.email}</p>
                      </td>

                      {/* Phone Number */}
                      <td className="py-4 pr-3">
                        <span className="text-xs font-medium text-brand-gray">
                          {c.phone || "-"}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 pr-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                          c.role === "ADMIN" 
                            ? "bg-brand-black text-brand-white border-brand-black" 
                            : "bg-brand-light text-brand-gray border-brand-light"
                        }`}>
                          {c.role}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 pr-3">
                        <p className="text-xs font-medium text-brand-gray flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-brand-gray-light shrink-0" />
                          <span>{formatDate(c.createdAt).split(" pukul ")[0]}</span>
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
                        <span className={`text-xs font-black whitespace-nowrap ${
                          totalSpendAmount > 0 ? "text-brand-black" : "text-brand-gray-light/60 font-bold"
                        }`}>
                          {totalSpendAmount > 0 ? formatIDR(totalSpendAmount) : "-"}
                        </span>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-4 pr-3 text-center">
                        <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                          c.isActive 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {c.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-3 text-right relative">
                        <div className="inline-block text-left">
                          <button
                            onClick={(e) => toggleActionMenu(c.id, e)}
                            className="p-1.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black rounded-lg cursor-pointer transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Absolute positioned Action Dropdown Menu */}
                          {activeMenuId === c.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-xl bg-brand-white border border-brand-light z-35 py-1 divide-y divide-brand-light overflow-hidden animate-fade-in font-sans text-left">
                              <div className="py-1">
                                <button
                                  onClick={() => openDetail(c)}
                                  className="w-full px-4 py-2 text-xs font-bold text-brand-black hover:bg-brand-light flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-brand-gray-light" />
                                  <span>Lihat Detail</span>
                                </button>
                                <button
                                  onClick={() => openEdit(c)}
                                  className="w-full px-4 py-2 text-xs font-bold text-brand-black hover:bg-brand-light flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-brand-gray-light" />
                                  <span>Edit User</span>
                                </button>
                                <button
                                  onClick={() => openRole(c)}
                                  className="w-full px-4 py-2 text-xs font-bold text-brand-black hover:bg-brand-light flex items-center gap-2 cursor-pointer"
                                >
                                  <Shield className="w-3.5 h-3.5 text-brand-gray-light" />
                                  <span>Ubah Role</span>
                                </button>
                                <button
                                  onClick={() => openPassword(c)}
                                  className="w-full px-4 py-2 text-xs font-bold text-brand-black hover:bg-brand-light flex items-center gap-2 cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5 text-brand-gray-light" />
                                  <span>Reset Password</span>
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  onClick={() => openStatusConfirm(c)}
                                  disabled={isSelf}
                                  className={`w-full px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer ${
                                    isSelf ? "opacity-40 cursor-not-allowed" : "text-brand-black hover:bg-brand-light"
                                  }`}
                                >
                                  {c.isActive ? (
                                    <>
                                      <Ban className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                      <span>Nonaktifkan</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>Aktifkan</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(c)}
                                  disabled={isSelf}
                                  className={`w-full px-4 py-2 text-xs font-bold text-red-600 flex items-center gap-2 cursor-pointer ${
                                    isSelf ? "opacity-40 cursor-not-allowed" : "hover:bg-red-50"
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Hapus User</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
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

      {/* Global document click to close active dropdown menu */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setActiveMenuId(null)}
        />
      )}

      {/* ─── MODAL: TAMBAH USER ────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormError("");
          setAddForm({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            phone: "",
            role: "USER"
          });
        }}
        title="Tambah User Baru"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans">
          {formError && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg font-bold uppercase tracking-wide leading-relaxed">
              ⚠️ {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Nama Lengkap *</label>
            <input 
              type="text" 
              required
              value={addForm.name}
              onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Budi Santoso"
              className="input-minimalist"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Alamat Email *</label>
            <input 
              type="email" 
              required
              value={addForm.email}
              onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="budi@example.com"
              className="input-minimalist"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Password *</label>
              <input 
                type="password" 
                required
                value={addForm.password}
                onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimal 8 karakter"
                className="input-minimalist"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Konfirmasi Password *</label>
              <input 
                type="password" 
                required
                value={addForm.confirmPassword}
                onChange={e => setAddForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Ulangi password"
                className="input-minimalist"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Nomor Telepon (opsional)</label>
              <input 
                type="text" 
                value={addForm.phone}
                onChange={e => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Contoh: 08123456789"
                className="input-minimalist"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Role Pengguna *</label>
              <select
                value={addForm.role}
                onChange={e => setAddForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-brand-light border border-transparent py-3 px-4 outline-none rounded-xl text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200 font-semibold"
              >
                <option value="USER">User / Pengguna Normal</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-brand-light pt-4 mt-6">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black font-bold uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-300"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Simpan User</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: EDIT USER ─────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setFormError("");
        }}
        title="Edit Profil User"
      >
        {selectedUser && (
          <form onSubmit={handleEditUser} className="space-y-4 text-xs font-sans">
            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg font-bold uppercase tracking-wide leading-relaxed">
                ⚠️ {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Nama Lengkap *</label>
              <input 
                type="text" 
                required
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama Lengkap"
                className="input-minimalist"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Alamat Email *</label>
              <input 
                type="email" 
                required
                value={editForm.email}
                onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                className="input-minimalist"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Nomor Telepon (opsional)</label>
              <input 
                type="text" 
                value={editForm.phone}
                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Nomor Telepon"
                className="input-minimalist"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-brand-light pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black font-bold uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-300"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── MODAL: UBAH ROLE ─────────────────────────────────────────────── */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setFormError("");
        }}
        title="Ubah Role Pengguna"
      >
        {selectedUser && (
          <form onSubmit={handleChangeRole} className="space-y-5 text-xs font-sans">
            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg font-bold uppercase tracking-wide leading-relaxed">
                ⚠️ {formError}
              </div>
            )}

            <div className="bg-brand-light p-4 rounded-xl border border-brand-light space-y-1.5">
              <p className="font-bold text-brand-black">Detail Pengguna:</p>
              <p><span className="text-brand-gray-light">Nama:</span> {selectedUser.name}</p>
              <p><span className="text-brand-gray-light">Email:</span> {selectedUser.email}</p>
              <p><span className="text-brand-gray-light">Role Saat Ini:</span> <span className="font-bold">{selectedUser.role}</span></p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Pilih Role Baru *</label>
              <select
                value={roleForm.role}
                onChange={e => setRoleForm({ role: e.target.value })}
                className="w-full bg-brand-light border border-transparent py-3 px-4 outline-none rounded-xl text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200 font-semibold"
              >
                <option value="USER">USER (Normal Customer)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
              </select>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl">
              <p className="font-bold uppercase tracking-wider text-[10px]">⚠️ Konfirmasi Perubahan Role</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Mengubah hak akses user akan memengaruhi izin akses mereka. Akun dengan role **ADMIN** akan mendapatkan hak penuh mengelola data toko, produk, transaksi, ulasan, pengaturan, dan user lain.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-brand-light pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-4 py-2.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black font-bold uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-300"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Ubah Role</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── MODAL: RESET PASSWORD ────────────────────────────────────────── */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setFormError("");
        }}
        title="Reset Password User"
      >
        {selectedUser && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-sans">
            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg font-bold uppercase tracking-wide leading-relaxed">
                ⚠️ {formError}
              </div>
            )}

            <div className="bg-brand-light p-4 rounded-xl border border-brand-light space-y-1">
              <p className="font-bold text-brand-black">Mereset password untuk:</p>
              <p><span className="text-brand-gray-light">User:</span> {selectedUser.name} ({selectedUser.email})</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Password Baru *</label>
              <input 
                type="password" 
                required
                value={passwordForm.password}
                onChange={e => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimal 8 karakter"
                className="input-minimalist"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Konfirmasi Password Baru *</label>
              <input 
                type="password" 
                required
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Ulangi password baru"
                className="input-minimalist"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-brand-light pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black font-bold uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-300"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Reset Password</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── MODAL: CONFIRM DEACTIVATE/ACTIVATE ────────────────────────────── */}
      <Modal
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        title={selectedUser?.isActive ? "Nonaktifkan User" : "Aktifkan User"}
      >
        {selectedUser && (
          <div className="space-y-5 text-xs font-sans">
            <div className="bg-brand-light p-4 rounded-xl border border-brand-light space-y-1.5">
              <p className="font-bold text-brand-black">Informasi User:</p>
              <p><span className="text-brand-gray-light">Nama:</span> {selectedUser.name}</p>
              <p><span className="text-brand-gray-light">Email:</span> {selectedUser.email}</p>
              <p><span className="text-brand-gray-light">Status Saat Ini:</span> <span className={`font-bold ${selectedUser.isActive ? "text-green-700" : "text-red-700"}`}>{selectedUser.isActive ? "Aktif" : "Nonaktif"}</span></p>
            </div>

            <p className="leading-relaxed text-brand-gray">
              Apakah Anda yakin ingin **{selectedUser.isActive ? "nonaktifkan" : "aktifkan kembali"}** akun user ini? 
              {selectedUser.isActive && " User yang dinonaktifkan tidak akan dapat masuk (login) ke sistem website."}
            </p>

            <div className="flex justify-end gap-2 border-t border-brand-light pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsStatusConfirmOpen(false)}
                className="px-4 py-2.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isSubmitting}
                className={`px-6 py-2.5 text-brand-white font-bold uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-300 ${
                  selectedUser.isActive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{selectedUser.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL: CONFIRM DELETE ─────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Hapus User Secara Permanen"
      >
        {selectedUser && (
          <div className="space-y-5 text-xs font-sans">
            <div className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-xl space-y-1.5">
              <p className="font-bold uppercase tracking-wider text-[10px]">⚠️ PERINGATAN HAPUS AKUN</p>
              <p className="text-[11px] leading-relaxed">
                Tindakan ini akan menghapus akun **{selectedUser.name} ({selectedUser.email})** secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <p className="leading-relaxed text-brand-gray">
              Jika user sudah memiliki riwayat transaksi atau order aktif di sistem, penghapusan mungkin akan ditolak demi menjaga integritas data keuangan toko.
            </p>

            <div className="flex justify-end gap-2 border-t border-brand-light pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-brand-white font-bold uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all duration-300"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL: USER DETAILS ──────────────────────────────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUser(null);
        }}
        title="Detail Akun Pengguna"
      >
        {selectedUser && (
          <div className="space-y-6 text-xs font-sans text-brand-gray">
            <div className="flex items-center gap-4 border-b border-brand-light pb-4">
              {selectedUser.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-brand-light"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-brand-black text-brand-white flex items-center justify-center font-black text-lg uppercase border border-brand-light shrink-0">
                  {selectedUser.name.substring(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-black text-brand-black uppercase tracking-wide truncate">
                  {selectedUser.name}
                </h4>
                <p className="text-[10px] text-brand-gray-light font-mono select-all mt-1 truncate">ID: {selectedUser.id}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                    selectedUser.role === "ADMIN" 
                      ? "bg-brand-black text-brand-white border-brand-black" 
                      : "bg-brand-light text-brand-gray border-brand-light"
                  }`}>
                    {selectedUser.role}
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                    selectedUser.isActive 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {selectedUser.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 border-b border-brand-light pb-5">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-brand-black">Informasi Kontak & Profil</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Email</p>
                  <p className="font-bold text-brand-black mt-0.5 select-all">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Nomor Telepon</p>
                  <p className="font-bold text-brand-black mt-0.5">{selectedUser.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Tanggal Terdaftar</p>
                  <p className="font-bold text-brand-black mt-0.5">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 pb-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-brand-black">Ringkasan Aktivitas Belanja</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-brand-light p-4 rounded-xl flex items-center justify-between border border-transparent">
                  <div>
                    <span className="text-[9px] text-brand-gray-light uppercase font-bold tracking-wider block">Jumlah Order Sukses</span>
                    <span className="text-xl font-black text-brand-black mt-1 block">
                      {selectedUser.orders.filter(o => o.paymentStatus === "PAID").length} Pesanan
                    </span>
                  </div>
                  <ShoppingBag className="w-5 h-5 text-brand-gray-light" />
                </div>
                <div className="bg-brand-light p-4 rounded-xl flex items-center justify-between border border-transparent">
                  <div>
                    <span className="text-[9px] text-brand-gray-light uppercase font-bold tracking-wider block">Total Pengeluaran Belanja</span>
                    <span className="text-lg font-black text-brand-black mt-1 block">
                      {formatIDR(selectedUser.orders.filter(o => o.paymentStatus === "PAID").reduce((acc, o) => acc + Number(o.total), 0))}
                    </span>
                  </div>
                  <CircleDollarSign className="w-5 h-5 text-brand-gray-light" />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-brand-light pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black font-bold uppercase tracking-widest rounded-xl cursor-pointer transition-all duration-300"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
