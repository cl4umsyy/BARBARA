"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl") || "";
    const target = callbackUrl
      ? `/?openAuth=login&callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/?openAuth=login";
    console.log("[LoginPage Redirect] Redirecting to modal login with target:", target);
    router.replace(target);
  }, [router, searchParams]);

  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginRedirect />
    </Suspense>
  );
}
