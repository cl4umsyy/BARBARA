"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuthModalStore, AuthModalTab } from "@/stores/useAuthModalStore";

function AuthModalListenerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openModal = useAuthModalStore((s) => s.openModal);

  useEffect(() => {
    // Support both ?openAuth= (from middleware redirects) and ?showAuth= (legacy)
    const param =
      (searchParams.get("openAuth") as AuthModalTab | null) ??
      (searchParams.get("showAuth") as AuthModalTab | null);
    const callbackUrl = searchParams.get("callbackUrl") ?? "/";

    if (param === "login" || param === "register") {
      openModal(param, callbackUrl);

      // Remove auth query params from URL without hard navigation
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openAuth");
      params.delete("showAuth");
      params.delete("callbackUrl");
      const newQuery = params.toString();
      const newUrl = pathname + (newQuery ? `?${newQuery}` : "");
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, openModal, router]);

  return null;
}

export function AuthModalListener() {
  return (
    <Suspense fallback={null}>
      <AuthModalListenerInner />
    </Suspense>
  );
}
