"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getPendingVerification } from "@/lib/pending-verification";

const EXEMPT_PATHS = ["/verify-otp"];

export function PendingVerificationGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const email = getPendingVerification();
    if (email && !EXEMPT_PATHS.includes(pathname)) {
      router.replace(`/verify-otp?email=${encodeURIComponent(email)}`);
    }
  }, [pathname, router]);

  return null;
}