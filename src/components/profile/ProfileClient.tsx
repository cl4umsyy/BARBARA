"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Check, 
  Edit, 
  Trash2, 
  Plus, 
  LogOut, 
  Loader2, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  createdAt: string;
}

interface AddressData {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  district: string;
  postalCode: string;
  addressDetail: string;
  isDefault: boolean;
  createdAt: string;
}

interface ProfileClientProps {
  initialProfile: ProfileData;
  initialAddresses: AddressData[];
}

export default function ProfileClient({ initialProfile, initialAddresses }: ProfileClientProps) {
  const router = useRouter();
  
  // Navigation tabs: 'profile' | 'addresses' | 'security'
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "security">("profile");

  // Notification / toast status
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- TAB 1: Profile ---
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: initialProfile.name,
    phone: initialProfile.phone,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile avatar crop states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Mock promo notification state
  const [receivePromo, setReceivePromo] = useState(true);

  // Avatar change picker (opens crop modal)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran file maksimal adalah 5 MB", "error");
      return;
    }

    // Validate type (JPG, JPEG, PNG, WEBP)
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      showToast("Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Dragging event handlers for crop window
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    setOffset({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Simple canvas 1:1 crop rendering and upload handler
  const handleCropSave = async () => {
    if (!cropImageSrc || !imgRef.current) return;

    setIsUploadingAvatar(true);
    setIsCropModalOpen(false);

    try {
      const img = imgRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.translate(200, 200);
        ctx.scale(scale, scale);
        ctx.translate(offset.x * (400 / 300) / scale, offset.y * (400 / 300) / scale);

        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawW, drawH;
        if (imgAspect >= 1) {
          drawH = 400;
          drawW = 400 * imgAspect;
        } else {
          drawW = 400;
          drawH = 400 / imgAspect;
        }
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      }

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            showToast("Gagal memotong gambar", "error");
            setIsUploadingAvatar(false);
            return;
          }

          const fileToUpload = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("file", fileToUpload);

          try {
            const uploadRes = await fetch("/api/profile/avatar", {
              method: "POST",
              body: formData,
            });

            if (!uploadRes.ok) {
              const errorData = await uploadRes.json();
              throw new Error(errorData.error || "Gagal mengunggah foto");
            }

            const { url: avatarUrl } = await uploadRes.json();
            setProfile((prev) => ({
              ...prev,
              avatarUrl,
            }));
            showToast("Foto profil berhasil diperbarui!");
          } catch (err: any) {
            showToast(err.message || "Terjadi kesalahan saat mengunggah foto", "error");
          } finally {
            setIsUploadingAvatar(false);
          }
        },
        "image/jpeg",
        0.9
      );
    } catch (err: any) {
      console.error(err);
      showToast("Gagal memproses gambar", "error");
      setIsUploadingAvatar(false);
    }
  };

  // Avatar delete handler
  const handleDeleteAvatar = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus foto profil?")) {
      setIsUploadingAvatar(true);
      try {
        const res = await fetch("/api/profile/avatar", {
          method: "DELETE",
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Gagal menghapus foto profil");
        }

        setProfile((prev) => ({
          ...prev,
          avatarUrl: "",
        }));
        showToast("Foto profil berhasil dihapus!");
      } catch (err: any) {
        showToast(err.message || "Gagal menghapus foto profil", "error");
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast("Nama tidak boleh kosong", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim() || null,
          avatarUrl: profile.avatarUrl || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal memperbarui profil");
      }

      const { user: updatedUser } = await res.json();
      setProfile({
        ...profile,
        name: updatedUser.name,
        phone: updatedUser.phone || "",
      });
      setIsEditingProfile(false);
      showToast("Informasi profil berhasil diperbarui!");
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan server", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- TAB 2: Addresses ---
  const [addresses, setAddresses] = useState<AddressData[]>(initialAddresses);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState<string | null>(null);

  // Address form fields
  const [addressForm, setAddressForm] = useState({
    label: "",
    recipientName: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    postalCode: "",
    addressDetail: "",
    isDefault: false,
  });

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({
      label: "",
      recipientName: "",
      phone: "",
      province: "",
      city: "",
      district: "",
      postalCode: "",
      addressDetail: "",
      isDefault: addresses.length === 0, // Force default if it's the first address
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: AddressData) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode,
      addressDetail: addr.addressDetail,
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick validation
    if (!addressForm.label.trim()) return showToast("Label alamat wajib diisi", "error");
    if (!addressForm.recipientName.trim()) return showToast("Nama penerima wajib diisi", "error");
    if (!addressForm.phone.trim()) return showToast("Nomor telepon wajib diisi", "error");
    if (!addressForm.province.trim()) return showToast("Provinsi wajib diisi", "error");
    if (!addressForm.city.trim()) return showToast("Kota wajib diisi", "error");
    if (!addressForm.district.trim()) return showToast("Kecamatan wajib diisi", "error");
    if (!addressForm.postalCode.trim()) return showToast("Kode pos wajib diisi", "error");
    if (!addressForm.addressDetail.trim()) return showToast("Detail alamat wajib diisi", "error");

    setIsSavingAddress(true);
    try {
      const isEdit = !!editingAddress;
      const url = isEdit ? `/api/addresses/${editingAddress!.id}` : "/api/addresses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan alamat");
      }

      const data = await res.json();
      
      // Refresh address list from database to ensure default flag sync across items
      const fetchRes = await fetch("/api/addresses");
      if (fetchRes.ok) {
        const { addresses: updatedList } = await fetchRes.json();
        setAddresses(updatedList);
      }

      setIsAddressModalOpen(false);
      showToast(isEdit ? "Alamat berhasil diperbarui!" : "Alamat baru berhasil ditambahkan!");
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan alamat", "error");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addr: AddressData) => {
    if (addr.isDefault) return;

    try {
      const res = await fetch(`/api/addresses/${addr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: addr.label,
          recipientName: addr.recipientName,
          phone: addr.phone,
          province: addr.province,
          city: addr.city,
          district: addr.district,
          postalCode: addr.postalCode,
          addressDetail: addr.addressDetail,
          isDefault: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengubah alamat utama");
      }

      // Refresh list
      const fetchRes = await fetch("/api/addresses");
      if (fetchRes.ok) {
        const { addresses: updatedList } = await fetchRes.json();
        setAddresses(updatedList);
      }
      showToast("Alamat utama berhasil diperbarui!");
    } catch (err: any) {
      showToast(err.message || "Gagal memperbarui alamat", "error");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (isDeletingAddress) return;
    
    // Set loading indicator
    setIsDeletingAddress(id);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menghapus alamat");
      }

      // Refresh list
      const fetchRes = await fetch("/api/addresses");
      if (fetchRes.ok) {
        const { addresses: updatedList } = await fetchRes.json();
        setAddresses(updatedList);
      } else {
        setAddresses(addresses.filter(a => a.id !== id));
      }
      showToast("Alamat berhasil dihapus");
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus alamat", "error");
    } finally {
      setIsDeletingAddress(null);
    }
  };

  // --- TAB 3: Security & Passwords ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Live password validation checks
  const isLengthValid = passwordForm.newPassword.length >= 8;
  const hasCapital = /[A-Z]/.test(passwordForm.newPassword);
  const hasNumber = /[0-9]/.test(passwordForm.newPassword);
  const isMatch = passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword.length > 0;

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!passwordForm.currentPassword) {
      return showToast("Masukkan password lama Anda", "error");
    }
    if (!isLengthValid || !hasCapital || !hasNumber) {
      return showToast("Password baru belum memenuhi semua persyaratan keamanan", "error");
    }
    if (!isMatch) {
      return showToast("Konfirmasi password baru tidak cocok", "error");
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal memperbarui password");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password Anda berhasil diperbarui!");
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    signOut({ callbackUrl: "/" });
  };

  // Date Formatting Helper
  const formatDateJoined = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateString));
    } catch (e) {
      return "-";
    }
  };

  return (
    <div className="w-full bg-brand-white flex-1 min-h-[80vh] relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-xs font-bold uppercase tracking-wider ${
            toast.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16 flex flex-col gap-10">
        
        {/* Header */}
        <div className="border-b border-brand-light pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
            Pengaturan Akun
          </p>
          <h1 className="text-2xl md:text-5xl font-black tracking-widest text-brand-black mt-1 uppercase">
            PROFIL SAYA
          </h1>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Profile Header Card & Tabs */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* User Overview Box */}
            <div className="bg-brand-white border border-brand-light rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-brand-black" />
              
              {/* Profile Avatar and Uploader */}
              <div className="flex flex-col items-center gap-1 mt-4 mb-4">
                <div className="relative">
                  <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-brand-black/10 bg-brand-light flex items-center justify-center">
                    {profile.avatarUrl ? (
                      <Image 
                        src={profile.avatarUrl} 
                        alt={profile.name} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-black text-brand-white font-black text-3xl uppercase">
                        {profile.name.substring(0, 2)}
                      </div>
                    )}
                    
                    {/* Upload Hover Overlay */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-brand-white text-[9px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-80"
                      aria-label="Upload profile picture"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mb-1" />
                          <span>Ubah</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Floating Camera Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 bg-brand-black text-brand-white p-2 rounded-full border border-brand-white shadow-md hover:bg-brand-white hover:text-brand-black transition-colors cursor-pointer animate-fade-in"
                    aria-label="Upload profile picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {profile.avatarUrl && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={isUploadingAvatar}
                    className="text-[9px] text-red-600 hover:text-red-700 font-bold uppercase tracking-wider mt-2 cursor-pointer disabled:opacity-50"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>

              {/* User info details */}
              <h2 className="font-black text-brand-black text-lg uppercase tracking-wide truncate max-w-full">
                {profile.name}
              </h2>
              <p className="text-[11px] font-medium text-brand-gray-light truncate max-w-full">
                {profile.email}
              </p>
              
              <div className="flex items-center gap-1.5 text-[10px] text-brand-gray mt-4 bg-brand-light/60 px-3 py-1.5 rounded-lg border border-brand-light">
                <Calendar className="w-3.5 h-3.5" />
                <span>Gabung: {formatDateJoined(profile.createdAt)}</span>
              </div>
            </div>

            {/* Sidebar Navigation Buttons */}
            <div className="bg-brand-white border border-brand-light rounded-2xl overflow-hidden p-2 flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3 w-full text-left px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === "profile" 
                    ? "bg-brand-black text-brand-white" 
                    : "text-brand-black hover:bg-brand-light"
                }`}
              >
                <UserIcon className="w-4 h-4 flex-shrink-0" />
                Informasi Akun
              </button>
              
              <button
                onClick={() => setActiveTab("addresses")}
                className={`flex items-center gap-3 w-full text-left px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === "addresses" 
                    ? "bg-brand-black text-brand-white" 
                    : "text-brand-black hover:bg-brand-light"
                }`}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Alamat Pengiriman
              </button>
              
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-3 w-full text-left px-4 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === "security" 
                    ? "bg-brand-black text-brand-white" 
                    : "text-brand-black hover:bg-brand-light"
                }`}
              >
                <Shield className="w-4 h-4 flex-shrink-0" />
                Keamanan & Akun
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Active Tab Content Area */}
          <div className="lg:col-span-8 bg-brand-white border border-brand-light rounded-2xl p-6 md:p-8 min-h-[500px]">
            
            {/* --- TAB: INFORMASI PROFIL --- */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="border-b border-brand-light pb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-brand-black">
                    Detail Informasi Akun
                  </h3>
                  <p className="text-[11px] text-brand-gray mt-1 leading-relaxed">
                    Lihat dan perbarui informasi data diri pribadi Anda.
                  </p>
                </div>

                {!isEditingProfile ? (
                  /* Profile Details Static View */
                  <div className="flex flex-col gap-5 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-brand-light rounded-xl p-4 bg-brand-light/20">
                        <span className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Nama Lengkap
                        </span>
                        <p className="text-xs font-bold text-brand-black mt-1 uppercase tracking-wide">
                          {profile.name}
                        </p>
                      </div>
                      <div className="border border-brand-light rounded-xl p-4 bg-brand-light/20">
                        <span className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Alamat Email
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs font-bold text-brand-black truncate pr-2">
                            {profile.email}
                          </p>
                          <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 rounded uppercase tracking-wider">
                            Terverifikasi
                          </span>
                        </div>
                      </div>
                      <div className="border border-brand-light rounded-xl p-4 bg-brand-light/20">
                        <span className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Nomor Telepon
                        </span>
                        <p className="text-xs font-bold text-brand-black mt-1">
                          {profile.phone || "Belum ditambahkan"}
                        </p>
                      </div>
                      <div className="border border-brand-light rounded-xl p-4 bg-brand-light/20">
                        <span className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Tanggal Pendaftaran
                        </span>
                        <p className="text-xs font-bold text-brand-black mt-1">
                          {formatDateJoined(profile.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Marketing toggle preference (Mock UI) */}
                    <div className="border border-brand-light rounded-xl p-4 mt-2 flex items-center justify-between">
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-black">
                          Preferensi Promosi
                        </span>
                        <span className="text-[10.5px] text-brand-gray leading-relaxed">
                          Terima buletin berkala dan penawaran diskon eksklusif dari barbara via email.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={receivePromo} 
                          onChange={(e) => {
                            setReceivePromo(e.target.checked);
                            showToast("Preferensi promosi diperbarui!");
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-10 h-5 bg-brand-light border border-brand-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-gray-light after:border-brand-light after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-black peer-checked:after:bg-brand-white" />
                      </label>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setProfileForm({ name: profile.name, phone: profile.phone });
                          setIsEditingProfile(true);
                        }}
                        className="font-black uppercase tracking-wider text-xs border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black px-6 py-3.5 rounded-xl transition-all duration-300 cursor-pointer"
                      >
                        Edit Profil Saya
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Profile Details Editing Form */
                  <form onSubmit={handleProfileSave} className="flex flex-col gap-5 mt-2">
                    <div className="flex flex-col gap-4">
                      <Input
                        label="Nama Lengkap"
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                        placeholder="Masukkan nama lengkap Anda"
                        className="text-xs"
                      />
                      
                      <Input
                        label="Nomor Telepon"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/[^0-9+]/g, "") })}
                        placeholder="Contoh: 081234567890"
                        className="text-xs"
                      />
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-wider text-brand-black font-bold">
                          Email (Tidak Dapat Diubah)
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="input-minimalist bg-brand-light/50 text-brand-gray-light cursor-not-allowed text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="flex items-center justify-center font-black uppercase tracking-wider text-xs border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black px-6 py-3.5 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            Menyimpan...
                          </>
                        ) : "Simpan Perubahan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="font-black uppercase tracking-wider text-xs border-2 border-brand-light bg-brand-white text-brand-gray hover:bg-brand-light hover:text-brand-black px-6 py-3.5 rounded-xl transition-all duration-300 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}

            {/* --- TAB: ALAMAT PENGIRIMAN --- */}
            {activeTab === "addresses" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="border-b border-brand-light pb-4 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-brand-black">
                      Alamat Pengiriman
                    </h3>
                    <p className="text-[11px] text-brand-gray mt-1 leading-relaxed">
                      Kelola daftar alamat tujuan pengiriman pesanan belanja Anda.
                    </p>
                  </div>
                  
                  <button
                    onClick={openAddAddressModal}
                    className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px] border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Alamat
                  </button>
                </div>

                {addresses.length === 0 ? (
                  /* Empty state for address list */
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 bg-brand-light flex items-center justify-center rounded-2xl border border-brand-light mb-4">
                      <MapPin className="w-5 h-5 text-brand-gray-light" />
                    </div>
                    <h4 className="font-bold text-brand-black text-sm uppercase tracking-wider">
                      Belum Ada Alamat
                    </h4>
                    <p className="text-[11px] text-brand-gray mt-1.5 max-w-xs leading-relaxed">
                      Tambahkan alamat pengiriman utama Anda untuk memudahkan pengisian data saat checkout pesanan.
                    </p>
                    <button
                      onClick={openAddAddressModal}
                      className="mt-6 font-black uppercase tracking-wider text-[10px] border-2 border-brand-black bg-brand-white text-brand-black hover:bg-brand-black hover:text-brand-white px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      Tambah Alamat Pertama
                    </button>
                  </div>
                ) : (
                  /* Shipping Addresses Cards grid list */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                          addr.isDefault 
                            ? "border-brand-black bg-brand-white shadow-sm ring-1 ring-brand-black/5" 
                            : "border-brand-light bg-brand-white hover:border-brand-gray-light"
                        }`}
                      >
                        <div>
                          {/* Card Header label */}
                          <div className="flex justify-between items-center gap-2 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-black truncate max-w-[60%]">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <Badge variant="solid" className="text-[8px] tracking-widest px-2 py-0.5 rounded">
                                Utama
                              </Badge>
                            )}
                          </div>

                          {/* Recipient Details */}
                          <p className="text-xs font-bold text-brand-black uppercase tracking-wide">
                            {addr.recipientName}
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-[11px] text-brand-gray mt-1.5">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{addr.phone}</span>
                          </div>

                          {/* Address strings details */}
                          <div className="text-[11px] text-brand-gray mt-3 border-t border-brand-light/50 pt-2 leading-relaxed">
                            <p className="text-brand-black font-semibold">
                              {addr.addressDetail}
                            </p>
                            <p className="mt-0.5">
                              {addr.district}, {addr.city}
                            </p>
                            <p>
                              {addr.province}, {addr.postalCode}
                            </p>
                          </div>
                        </div>

                        {/* Card Actions bar */}
                        <div className="flex flex-wrap items-center justify-between mt-5 pt-3 border-t border-brand-light/30 gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditAddressModal(addr)}
                              className="flex items-center gap-1 text-[10px] font-bold text-brand-black hover:opacity-75 uppercase tracking-wider cursor-pointer"
                              aria-label="Edit address"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              disabled={isDeletingAddress === addr.id}
                              className="flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider cursor-pointer disabled:opacity-50"
                              aria-label="Delete address"
                            >
                              {isDeletingAddress === addr.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Hapus
                            </button>
                          </div>

                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr)}
                              className="text-[9px] font-black uppercase tracking-widest text-brand-black border border-brand-black hover:bg-brand-black hover:text-brand-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Jadikan Utama
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* --- TAB: KEAMANAN & AKUN --- */}
            {activeTab === "security" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="border-b border-brand-light pb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-brand-black">
                    Keamanan Akun
                  </h3>
                  <p className="text-[11px] text-brand-gray mt-1 leading-relaxed">
                    Ubah kata sandi secara berkala untuk menjaga keamanan akun e-commerce Anda.
                  </p>
                </div>

                <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-5 mt-2 max-w-md">
                  
                  {/* Current Password Field */}
                  <div className="relative">
                    <Input
                      label="Kata Sandi Saat Ini"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      placeholder="Masukkan kata sandi lama Anda"
                      className="text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-[34px] text-brand-gray-light hover:text-brand-black p-1"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* New Password Field */}
                  <div className="relative">
                    <Input
                      label="Kata Sandi Baru"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      placeholder="Minimal 8 karakter, 1 huruf besar, 1 angka"
                      className="text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-[34px] text-brand-gray-light hover:text-brand-black p-1"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Confirm New Password Field */}
                  <div className="relative">
                    <Input
                      label="Konfirmasi Kata Sandi Baru"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      placeholder="Ulangi kata sandi baru Anda"
                      className="text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-[34px] text-brand-gray-light hover:text-brand-black p-1"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Security Checklist */}
                  <div className="bg-brand-light/35 border border-brand-light rounded-xl p-4 flex flex-col gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-black">
                      Syarat Keamanan Password:
                    </span>
                    <div className="flex flex-col gap-1.5 mt-1 text-[10.5px]">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          isLengthValid ? "bg-green-100 border-green-300 text-green-700" : "bg-brand-light border-brand-light text-brand-gray-light"
                        }`}>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className={isLengthValid ? "text-green-800 font-bold" : "text-brand-gray"}>
                          Minimal 8 karakter
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasCapital ? "bg-green-100 border-green-300 text-green-700" : "bg-brand-light border-brand-light text-brand-gray-light"
                        }`}>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className={hasCapital ? "text-green-800 font-bold" : "text-brand-gray"}>
                          Minimal 1 huruf kapital (A-Z)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          hasNumber ? "bg-green-100 border-green-300 text-green-700" : "bg-brand-light border-brand-light text-brand-gray-light"
                        }`}>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className={hasNumber ? "text-green-800 font-bold" : "text-brand-gray"}>
                          Minimal 1 karakter angka (0-9)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          isMatch ? "bg-green-100 border-green-300 text-green-700" : "bg-brand-light border-brand-light text-brand-gray-light"
                        }`}>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className={isMatch ? "text-green-800 font-bold" : "text-brand-gray"}>
                          Konfirmasi kata sandi cocok
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex items-center justify-center font-black uppercase tracking-wider text-xs border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black px-6 py-3.5 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          Memproses...
                        </>
                      ) : "Ubah Kata Sandi"}
                    </button>
                  </div>
                </form>

                {/* Account Sign Out Action (Boundary Line) */}
                <div className="border-t border-brand-light pt-6 mt-6">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600 block">
                    Tindakan Akun
                  </span>
                  <p className="text-[11px] text-brand-gray mt-1 leading-relaxed max-w-md">
                    Keluar dari sesi login perangkat ini. Anda harus memasukkan email dan kata sandi kembali untuk mengakses profil.
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 mt-4 font-black uppercase tracking-wider text-xs border-2 border-red-600 bg-red-600 text-brand-white hover:bg-brand-white hover:text-red-600 px-6 py-3.5 rounded-xl transition-all duration-300 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar dari Akun (Sign Out)
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* --- MODAL DIALOG: TAMBAH / EDIT ALAMAT PENGIRIMAN --- */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title={editingAddress ? "Ubah Alamat Pengiriman" : "Tambah Alamat Baru"}
      >
        <form onSubmit={handleAddressSubmit} className="flex flex-col gap-4 text-xs font-medium">
          
          <Input
            label="Label Alamat (Contoh: Rumah, Kantor)"
            type="text"
            value={addressForm.label}
            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
            required
            placeholder="misal: Rumah"
            className="text-xs"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Penerima"
              type="text"
              value={addressForm.recipientName}
              onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
              required
              placeholder="Masukkan nama penerima"
              className="text-xs"
            />
            <Input
              label="Nomor Telepon Penerima"
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/[^0-9+]/g, "") })}
              required
              placeholder="Contoh: 0812XXXXXXXX"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Provinsi"
              type="text"
              value={addressForm.province}
              onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
              required
              placeholder="Masukkan Provinsi"
              className="text-xs"
            />
            <Input
              label="Kota / Kabupaten"
              type="text"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              required
              placeholder="Masukkan Kota/Kabupaten"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kecamatan"
              type="text"
              value={addressForm.district}
              onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
              required
              placeholder="Masukkan Kecamatan"
              className="text-xs"
            />
            <Input
              label="Kode Pos"
              type="text"
              value={addressForm.postalCode}
              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value.replace(/[^0-9]/g, "") })}
              required
              placeholder="Masukkan 5 digit kode pos"
              className="text-xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-brand-black font-bold">
              Detail Alamat (Jalan, RT/RW, Blok, No. Rumah)
            </label>
            <textarea
              value={addressForm.addressDetail}
              onChange={(e) => setAddressForm({ ...addressForm, addressDetail: e.target.value })}
              required
              rows={3}
              placeholder="Tuliskan alamat lengkap secara detail beserta patokan jalan..."
              className="input-minimalist resize-none text-xs"
            />
          </div>

          {/* isDefault Address Checkbox (Disabled if it is already default or if it's the first/only address) */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isDefaultCheckbox"
              checked={addressForm.isDefault}
              disabled={editingAddress?.isDefault || addresses.length === 0}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="w-4 h-4 accent-black border border-brand-black rounded"
            />
            <label htmlFor="isDefaultCheckbox" className="text-brand-black font-bold uppercase tracking-wider text-[10px] cursor-pointer select-none">
              Jadikan sebagai Alamat Utama (Default)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 mt-6 border-t border-brand-light pt-4">
            <button
              type="submit"
              disabled={isSavingAddress}
              className="flex-1 flex items-center justify-center font-black uppercase tracking-wider text-xs border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black py-4 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {isSavingAddress ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : "Simpan Alamat"}
            </button>
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              className="flex-1 font-black uppercase tracking-wider text-xs border-2 border-brand-light bg-brand-white text-brand-gray hover:bg-brand-light hover:text-brand-black py-4 rounded-xl transition-all duration-300 cursor-pointer"
            >
              Batal
            </button>
          </div>

        </form>
      </Modal>

      {/* --- CROP IMAGE MODAL --- */}
      <Modal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        title="Sesuaikan Foto Profil"
      >
        <div className="flex flex-col items-center gap-6 py-2">
          {/* Viewport container with circle mask */}
          <div 
            className="w-[300px] h-[300px] bg-brand-light border border-brand-light rounded-xl overflow-hidden relative cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Circular mask overlay */}
            <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none z-10 flex items-center justify-center">
              <div className="w-[240px] h-[240px] rounded-full border-2 border-dashed border-brand-white/80" />
            </div>

            {/* Preview Image */}
            {cropImageSrc && (
              <img
                ref={imgRef}
                src={cropImageSrc}
                alt="Crop preview"
                className="max-w-none pointer-events-none absolute top-0 left-0 w-[300px] h-[300px]"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                  objectFit: "contain",
                }}
              />
            )}
          </div>

          {/* Zoom Control Slider */}
          <div className="w-full flex flex-col gap-2 px-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-black">
              <span>Perbesar Gambar (Zoom)</span>
              <span>{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-brand-light rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>

          <div className="text-[10px] text-brand-gray text-center max-w-xs leading-relaxed font-semibold uppercase tracking-wider">
            Geser gambar untuk menyesuaikan bagian yang ingin dipotong.
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full border-t border-brand-light pt-4 mt-2">
            <button
              type="button"
              onClick={handleCropSave}
              className="flex-1 flex items-center justify-center font-black uppercase tracking-wider text-xs border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black py-4 rounded-xl transition-all duration-300 cursor-pointer"
            >
              Simpan Foto
            </button>
            <button
              type="button"
              onClick={() => setIsCropModalOpen(false)}
              className="flex-1 font-black uppercase tracking-wider text-xs border-2 border-brand-light bg-brand-white text-brand-gray hover:bg-brand-light hover:text-brand-black py-4 rounded-xl transition-all duration-300 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
