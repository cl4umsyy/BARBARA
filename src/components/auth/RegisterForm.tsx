"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Eye, EyeOff, UserPlus, Check } from "lucide-react";
import { useAuthModalStore } from "@/stores/useAuthModalStore";

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export function RegisterForm() {
  const router = useRouter();
  const { callbackUrl, closeModal, setActiveTab } = useAuthModalStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: callbackUrl || "/" });
  };

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
      console.log("[RegisterForm] Auto-logging in user:", email, "callbackUrl:", callbackUrl);
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("[RegisterForm] Auto-login result:", result);
      setIsLoading(false);

      if (result?.error) {
        // Registration succeeded but login failed – switch to login tab
        console.error("[RegisterForm] Auto-login failed:", result.error);
        setActiveTab("login");
        return;
      }

      console.log("[RegisterForm] Registration and auto-login success. Fetching session...");
      const session = await getSession();
      const userRole = session?.user?.role;
      console.log("[RegisterForm] Session fetched. Role:", userRole);

      closeModal();
      if (userRole === "ADMIN") {
        router.push("/admin");
      } else {
        const targetUrl = (callbackUrl === "/" || callbackUrl.startsWith("/auth")) ? "/" : callbackUrl;
        router.push(targetUrl);
      }
      router.refresh();
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

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        id="register-google-btn"
        className="w-full flex items-center justify-center gap-3 bg-brand-white text-brand-black font-bold uppercase tracking-wider text-xs py-3.5 px-6 rounded-xl border border-brand-light hover:bg-[#f8f9fa] hover:border-brand-gray-light transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
      >
        <GoogleIcon />
        <span>Daftar dengan Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-1">
        <div className="border-t border-brand-light w-full" />
        <span className="bg-brand-white px-3 text-[10px] font-bold uppercase tracking-widest text-brand-gray-light absolute">
          Atau
        </span>
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
