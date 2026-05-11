"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { AppSidebar } from "@/components/AppSidebar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/" && !pathname?.startsWith("/auth");

  return (
    <>
      {showSidebar ? <AppSidebar /> : <NavBar />}
      <div className={showSidebar ? "pl-[3.25rem]" : ""}>
        {children}
      </div>
    </>
  );
}
