"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuthModalStore } from "@/stores/useAuthModalStore";

export function LoginForm() {
  const { callbackUrl, closeModal, setActiveTab } = useAuthModalStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Email atau password salah. Silakan coba lagi.");
      return;
    }

    closeModal();
    // Refresh current page to update session state
    window.location.href = callbackUrl;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gray-light">
          Selamat Datang Kembali
        </p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-brand-black">
          Masuk ke Akun Anda
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="login-email"
            className="text-xs font-bold uppercase tracking-wider text-brand-black"
          >
            Email
          </label>
          <input
            id="login-email"
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
            htmlFor="login-password"
            className="text-xs font-bold uppercase tracking-wider text-brand-black"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
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
          {error && (
            <p className="text-red-500 text-xs font-medium mt-1">{error}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          id="login-submit-btn"
          className="mt-2 w-full flex items-center justify-center gap-2 bg-brand-black text-brand-white font-bold uppercase tracking-[0.2em] text-sm py-3.5 px-8 rounded-xl border-2 border-brand-black hover:bg-brand-white hover:text-brand-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Masuk...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-brand-gray">
          Belum punya akun?{" "}
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className="font-bold text-brand-black underline underline-offset-2 hover:opacity-70 transition-opacity cursor-pointer"
          >
            Daftar sekarang
          </button>
        </p>
      </div>
    </div>
  );
}
