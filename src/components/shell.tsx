"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Landmark,
  FileText,
  Receipt,
  Building2,
  Users,
  User,
  LogOut,
  Activity,
  MoreHorizontal,
  X,
  Banknote,
  AlertTriangle,
  ShieldCheck,
  CalendarCheck2,
  FolderOpen,
  ChevronLeft,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

// Yayasan domain
const yayasanNav: NavItem[] = [
  { href: "/", label: "Yayasan", icon: Landmark },
  { href: "/laporan-op", label: "Laporan Op", icon: FileText },
  { href: "/pengajuan", label: "Pengajuan", icon: Receipt },
  { href: "/wajib-bulanan", label: "Wajib Bulanan", icon: CalendarDays },
  { href: "/sewa", label: "Sewa Dapur", icon: Building2 },
  { href: "/dana-cash", label: "Cash Yayasan", icon: Banknote },
  { href: "/dokumen", label: "Dokumen", icon: FolderOpen },
  { href: "/ompreng", label: "Ompreng", icon: UtensilsCrossed },
  { href: "/pemantauan", label: "Pemantauan", icon: ClipboardList },
];

// Personal domain
const pribadiNav: NavItem[] = [
  { href: "/pribadi", label: "Pengeluaran", icon: User },
  { href: "/cicilan", label: "Cicilan Bulanan", icon: CreditCard },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/agenda", label: "Agenda", icon: CalendarCheck2 },
];

// Mobile: 4 primary items shown directly
const mobilePrimary: NavItem[] = [
  { href: "/", label: "Yayasan", icon: Landmark },
  { href: "/pengajuan", label: "Pengajuan", icon: Receipt },
  { href: "/pribadi", label: "Pengeluaran", icon: User },
  { href: "/agenda", label: "Agenda", icon: CalendarCheck2 },
];

// Mobile: overflow items under "Lainnya"
const mobileMore: NavItem[] = [
  { href: "/cicilan", label: "Cicilan", icon: CreditCard },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/laporan-op", label: "Laporan Op", icon: FileText },
  { href: "/wajib-bulanan", label: "Wajib Bulanan", icon: CalendarDays },
  { href: "/sewa", label: "Sewa Dapur", icon: Building2 },
  { href: "/dana-cash", label: "Cash Yayasan", icon: Banknote },
  { href: "/dokumen", label: "Dokumen", icon: FolderOpen },
  { href: "/ompreng", label: "Ompreng", icon: UtensilsCrossed },
  { href: "/pemantauan", label: "Pemantauan", icon: ClipboardList },
  { href: "/aktivitas", label: "Aktivitas", icon: Activity },
  { href: "/duplikat", label: "Cek Duplikat", icon: AlertTriangle },
  { href: "/audit", label: "Audit Data", icon: ShieldCheck },
  { href: "/users", label: "Users", icon: Users },
];

// Monitoring
const monitorNav: NavItem[] = [
  { href: "/aktivitas", label: "Aktivitas", icon: Activity },
  { href: "/duplikat", label: "Cek Duplikat", icon: AlertTriangle },
  { href: "/audit", label: "Audit Data", icon: ShieldCheck },
];

const adminNav: NavItem[] = [{ href: "/users", label: "Users", icon: Users }];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const moreIsActive = mobileMore.some((item) => isActive(item.href));

  // Derive current page title from pathname
  const allNavItems: NavItem[] = [
    ...yayasanNav,
    ...pribadiNav,
    ...monitorNav,
    ...adminNav,
  ];
  const currentPageTitle =
    allNavItems.find((item) => isActive(item.href))?.label ?? "Dashboard";

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          active
            ? "border-l-2 border-primary bg-primary/15 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5", active && "text-primary")} />
        {label}
      </Link>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Mobile top header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between border-b border-border/60 bg-card/95 px-4 backdrop-blur-lg supports-[backdrop-filter]:bg-card/85 md:hidden">
        <div className="flex items-center gap-2">
          {!mobilePrimary.some((item) => isActive(item.href)) ? (
            <button
              onClick={() => router.back()}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Landmark className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="text-sm font-semibold tracking-tight">Angkasa</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{currentPageTitle}</span>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border/60 bg-card shadow-sm md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Angkasa</h1>
            <p className="text-xs text-muted-foreground leading-none">Dashboard Keuangan</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {(
            [
              { label: "Yayasan", items: yayasanNav, first: true },
              { label: "Pribadi", items: pribadiNav, first: false },
              { label: "Monitor", items: monitorNav, first: false },
              { label: "Admin",   items: adminNav,   first: false },
            ] as const
          ).map(({ label, items, first }) => (
            <div key={label}>
              <p className={cn("px-3 pb-1.5 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider", first ? "pt-1" : "pt-4")}>
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-border/60 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60">
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-[calc(3rem+1.25rem)] md:px-6 md:pb-10 md:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile "More" overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-opacity duration-300",
          moreOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMoreOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 rounded-t-2xl bg-card pb-20 pt-3 px-4 shadow-xl transition-transform duration-300 ease-out",
            moreOpen ? "translate-y-0" : "translate-y-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm font-semibold">Lainnya</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {mobileMore.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 border-t border-border/60 pt-3">
              <button
                onClick={() => { setMoreOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Keluar
              </button>
            </div>
          </div>
        </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/85 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1">
          {mobilePrimary.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-xs font-medium transition-colors min-w-[48px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center gap-1 px-1 py-2.5 text-xs font-medium transition-colors min-w-[48px]",
              moreIsActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", moreIsActive && "text-primary")} />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
