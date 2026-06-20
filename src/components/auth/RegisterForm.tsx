"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, UserPlus, Check } from "lucide-react";
import { useAuthModalStore } from "@/stores/useAuthModalStore";

export function RegisterForm() {
  const { callbackUrl, closeModal, setActiveTab } = useAuthModalStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Anda harus menyetujui syarat dan ketentuan.");
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError("Password belum memenuhi persyaratan keamanan.");
      return;
    }

    setIsLoading(true);

    try {
      // Register the user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Pendaftaran gagal. Coba lagi.");
        setIsLoading(false);
        return;
      }

      // Auto login after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setIsLoading(false);

      if (result?.error) {
        // Registration succeeded but login failed – switch to login tab
        setActiveTab("login");
        return;
      }

      closeModal();
      window.location.href = callbackUrl;
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  }

  const PasswordHint = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <span
      className={`flex items-center gap-1 text-[11px] transition-colors ${
        met ? "text-green-600" : "text-brand-gray-light"
      }`}
    >
      <Check className={`w-3 h-3 ${met ? "opacity-100" : "opacity-30"}`} />
      {text}
    </span>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gray-light">
          Bergabung dengan barbara
        </p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-brand-black">
          Buat Akun Baru
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-name"
            className="text-xs font-bold uppercase tracking-wider text-brand-black"
          >
            Nama Lengkap
          </label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Anda"
            className="input-minimalist w-full"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-email"
            className="text-xs font-bold uppercase tracking-wider text-brand-black"
          >
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="input-minimalist w-full"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reg-password"
            className="text-xs font-bold uppercase tracking-wider text-brand-black"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Buat password"
              className="input-minimalist w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-black transition-colors cursor-pointer"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {/* Password strength hints */}
          {password.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <PasswordHint met={hasMinLength} text="Min. 8 karakter" />
              <PasswordHint met={hasUppercase} text="1 huruf kapital" />
              <PasswordHint met={hasNumber} text="1 angka" />
            </div>
          )}
        </div>

        {/* Terms Agreement */}
        <label className="flex items-start gap-3 cursor-pointer group mt-1">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              id="reg-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                agreed
                  ? "bg-brand-black border-brand-black"
                  : "bg-white border-brand-gray-light group-hover:border-brand-black"
              }`}
            >
              {agreed && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
          </div>
          <span className="text-xs text-brand-gray leading-relaxed">
            Saya setuju dengan{" "}
            <span className="font-bold text-brand-black underline underline-offset-2">
              Syarat &amp; Ketentuan
            </span>{" "}
            dan bergabung dengan program loyalitas barbara untuk mendapatkan
            penawaran eksklusif.
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs font-medium">{error}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          id="register-submit-btn"
          className="mt-1 w-full flex items-center justify-center gap-2 bg-brand-black text-brand-white font-bold uppercase tracking-[0.2em] text-sm py-3.5 px-8 rounded-xl border-2 border-brand-black hover:bg-brand-white hover:text-brand-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Mendaftar...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Daftar Sekarang
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-brand-gray">
          Sudah punya akun?{" "}
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className="font-bold text-brand-black underline underline-offset-2 hover:opacity-70 transition-opacity cursor-pointer"
          >
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  );
}
