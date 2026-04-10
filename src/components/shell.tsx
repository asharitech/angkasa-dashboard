"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Building2,
  CreditCard,
  ArrowLeftRight,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/laporan-op", label: "Laporan", icon: FileText },
  { href: "/pengajuan", label: "Pengajuan", icon: Receipt },
  { href: "/sewa", label: "Sewa", icon: Building2 },
  { href: "/cicilan", label: "Cicilan", icon: CreditCard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
];

const allNavItems = [
  ...navItems,
  { href: "/users", label: "Users", icon: Users },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border/60 bg-card shadow-sm md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Angkasa</h1>
            <p className="text-[10px] text-muted-foreground leading-none">Dashboard Keuangan</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {allNavItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60">
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-5 md:px-6 md:pb-10 md:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/85 md:hidden safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1">
          {[...navItems, { href: "/users", label: "Users", icon: Users }].map(
            ({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors min-w-[48px]",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                  <span>{label}</span>
                </Link>
              );
            }
          )}
        </div>
      </nav>
    </div>
  );
}
