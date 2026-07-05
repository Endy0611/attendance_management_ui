"use client";

import { Toaster } from "sileo";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {/* Mounted once at the root — every toastSuccess/toastError/etc. call
          from lib/toast.ts renders here, app-wide. See lib/toast.ts. */}
      <Toaster position="top-right" />
      {children}
    </TooltipProvider>
  );
}