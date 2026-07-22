"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Eye, EyeOff, LogIn } from "lucide-react";
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

export function LoginForm() {
  const router = useRouter();
  const { callbackUrl, closeModal, setActiveTab } = useAuthModalStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: callbackUrl || "/" });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("[LoginForm] Logging in user:", email, "callbackUrl:", callbackUrl);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    console.log("[LoginForm] signIn result:", result);
    setIsLoading(false);

    if (result?.error) {
      console.error("[LoginForm] Login failed:", result.error);
      setError("Email atau password salah. Silakan coba lagi.");
      return;
    }

    console.log("[LoginForm] Login success. Fetching session...");
    const session = await getSession();
    const userRole = session?.user?.role;
    console.log("[LoginForm] Session fetched. Role:", userRole);

    closeModal();
    if (userRole === "ADMIN") {
      router.push("/admin");
    } else {
      const targetUrl = (callbackUrl === "/" || callbackUrl.startsWith("/auth")) ? "/" : callbackUrl;
      router.push(targetUrl);
    }
    router.refresh();
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

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        id="login-google-btn"
        className="w-full flex items-center justify-center gap-3 bg-brand-white text-brand-black font-bold uppercase tracking-wider text-xs py-3.5 px-6 rounded-xl border border-brand-light hover:bg-[#f8f9fa] hover:border-brand-gray-light transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
      >
        <GoogleIcon />
        <span>Masuk dengan Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-1">
        <div className="border-t border-brand-light w-full" />
        <span className="bg-brand-white px-3 text-[10px] font-bold uppercase tracking-widest text-brand-gray-light absolute">
          Atau
        </span>
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
