"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl") || "";
    const target = callbackUrl
      ? `/?openAuth=register&callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/?openAuth=register";
    console.log("[RegisterPage Redirect] Redirecting to modal register with target:", target);
    router.replace(target);
  }, [router, searchParams]);

  return null;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirect />
    </Suspense>
  );
}
