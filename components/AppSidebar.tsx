"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, FileText, LogOut, ChevronsUpDown, Flame, Trash2, Sun, Moon, Monitor } from "lucide-react";
import { applyTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const sidebarVariants = {
  open: { width: "14rem" },
  closed: { width: "3.25rem" },
};

const contentVariants = {
  open: { display: "flex", opacity: 1 },
  closed: { display: "flex", opacity: 1 },
};

const labelVariants = {
  open: { x: 0, opacity: 1, transition: { x: { stiffness: 1000, velocity: -100 } } },
  closed: { x: -10, opacity: 0, transition: { x: { stiffness: 100 } } },
};

const transitionProps = { type: "tween" as const, ease: "easeOut" as const, duration: 0.2 };

interface LocalSession { planId: string; userId: string }

export function AppSidebar({ muteToggle }: { muteToggle?: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [authUser, setAuthUser] = useState<{ displayName: string; initials: string } | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("habitforge_session");
      if (raw) setPlanId((JSON.parse(raw) as LocalSession).planId);
    } catch { /* ignore */ }

    const saved = localStorage.getItem("habitforge_theme") as "light" | "dark" | "system" | null;
    if (saved) setTheme(saved);

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name =
        user.user_metadata?.display_name ??
        user.user_metadata?.full_name ??
        user.email ??
        "User";
      const initials = name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      setAuthUser({ displayName: name, initials });
    });
  }, [pathname]);

  const handleTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    applyTheme(t);
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    localStorage.removeItem("habitforge_session");
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch("/api/user/delete", { method: "DELETE" });
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      localStorage.removeItem("habitforge_session");
      router.push("/");
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(planId ? [{ href: `/results?plan=${planId}`, icon: FileText, label: "My Plan" }] : []),
  ];

  return (
    <>
    <motion.div
      className="fixed left-0 top-0 z-40 h-full shrink-0 border-r border-[var(--border)]"
      initial="closed"
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full flex-col bg-[var(--bg-base)] text-[var(--text-secondary)]"
        variants={contentVariants}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--border)] px-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-ember)] shrink-0">
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            <motion.span
              variants={labelVariants}
              className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap overflow-hidden"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
            >
              HabitForge
            </motion.span>
          </Link>
        </div>

        {/* Nav links */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 h-full p-2">
            <div className="flex flex-col gap-0.5">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === "/dashboard" ? href === "/dashboard" : pathname?.includes("results") && href.includes("results");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex h-8 w-full items-center rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]",
                      active && "bg-[var(--bg-raised)] text-[var(--accent-ember)]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <motion.span variants={labelVariants} className="ml-2 text-sm font-medium whitespace-nowrap overflow-hidden">
                      {!isCollapsed && label}
                    </motion.span>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>

          {/* Music toggle — visible when sidebar is expanded */}
          {muteToggle && !isCollapsed && (
            <div className="shrink-0 px-2 pb-1">
              {muteToggle}
            </div>
          )}

          {/* User account at bottom */}
          <div className="shrink-0 border-t border-[var(--border)] p-2">
            {authUser && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus:outline-none">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarFallback className="text-[10px]">{authUser.initials}</AvatarFallback>
                    </Avatar>
                    <motion.span
                      variants={labelVariants}
                      className="flex flex-1 items-center gap-1.5 overflow-hidden"
                    >
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate text-left text-sm font-medium text-[var(--text-primary)]">
                            {authUser.displayName}
                          </span>
                          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]/50" />
                        </>
                      )}
                    </motion.span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" sideOffset={8}>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{authUser.displayName}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Appearance</p>
                    <div className="flex gap-1">
                      {([
                        { value: "light", icon: Sun, label: "Light" },
                        { value: "dark",  icon: Moon, label: "Dark" },
                        { value: "system", icon: Monitor, label: "System" },
                      ] as const).map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => handleTheme(value)}
                          title={label}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors",
                            theme === value
                              ? "bg-[var(--bg-raised)] text-[var(--text-primary)] font-semibold"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-[var(--error)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 cursor-pointer rounded-md bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 focus:text-white mt-1"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Delete account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <div className="mb-1 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <h2 className="mt-3 text-center text-lg font-bold text-[var(--text-primary)]">
              Delete your account?
            </h2>
            <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
              This permanently deletes your habit plan, streaks, badges, and all progress. There&apos;s no going back.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-raised)] disabled:opacity-50"
              >
                Nah, my bad
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting && (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}
                {deleting ? "Deleting…" : "Yup"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
