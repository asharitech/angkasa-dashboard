"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Receipt,
  Building,
  Banknote,
  Utensils,
  Folder,
  Wallet,
  Calendar,
  Activity,
  Shield,
  Copy,
  Users,
  Search,
  Bell,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; id: string; badge?: number };

const yayasanNav: NavItem[] = [
  { id: "/", href: "/", label: "Ringkasan", icon: Home },
  { id: "/laporan-op", href: "/laporan-op", label: "Laporan Op", icon: BookOpen },
  { id: "/pengajuan", href: "/pengajuan", label: "Pengajuan", icon: Receipt },
  { id: "/sewa", href: "/sewa", label: "Sewa Dapur", icon: Building },
  { id: "/dana-cash", href: "/dana-cash", label: "Cash Yayasan", icon: Banknote },
  { id: "/ompreng", href: "/ompreng", label: "Ompreng", icon: Utensils },
  { id: "/dokumen", href: "/dokumen", label: "Dokumen", icon: Folder },
];

const pribadiNav: NavItem[] = [
  { id: "/pribadi", href: "/pribadi", label: "Keuangan Pribadi", icon: Wallet },
  { id: "/agenda", href: "/agenda", label: "Agenda", icon: Calendar },
];

const monitorNav: NavItem[] = [
  { id: "/aktivitas", href: "/aktivitas", label: "Aktivitas", icon: Activity },
  { id: "/audit", href: "/audit", label: "Audit Data", icon: Shield },
  { id: "/duplikat", href: "/duplikat", label: "Cek Duplikat", icon: Copy },
  { id: "/users", href: "/users", label: "Users", icon: Users },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const allNavItems: NavItem[] = [
    ...yayasanNav,
    ...pribadiNav,
    ...monitorNav,
  ];
  const currentPageTitle =
    allNavItems.find((item) => isActive(item.href))?.label ?? "Dashboard";

  function NavLink({ href, label, icon: Icon, badge }: NavItem) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "nav-item transition-all duration-200",
          active ? "is-active shadow-sm" : "hover:bg-ink-050"
        )}
      >
        <Icon className={cn("nav-item__icon", active ? "text-white" : "text-ink-400")} />
        <span className={active ? "font-semibold" : "font-medium"}>{label}</span>
        {badge ? <span className="nav-item__badge animate-pulse">{badge}</span> : null}
      </Link>
    );
  }

  const SidebarContent = (
    <>
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">A</div>
        <div>
          <div className="sidebar__brand-name">Angkasa</div>
          <div className="sidebar__brand-sub">YRBB · Finance</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="nav-group">
          <div className="nav-group__label">Yayasan YRBB</div>
          {yayasanNav.map((item) => (
            <NavLink key={item.id} {...item} />
          ))}
        </div>
        
        <div className="nav-group">
          <div className="nav-group__label">Pribadi</div>
          {pribadiNav.map((item) => (
            <NavLink key={item.id} {...item} />
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-group__label">Monitor</div>
          {monitorNav.map((item) => (
            <NavLink key={item.id} {...item} />
          ))}
        </div>
      </nav>

      <div className="sidebar__footer group cursor-pointer hover:bg-ink-025 transition-colors">
        <div className="avatar ring-2 ring-accent-100 group-hover:ring-accent-300 transition-all">AG</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sidebar__user-name group-hover:text-ink-000 transition-colors">Angkasa</div>
          <div className="sidebar__user-role">Admin</div>
        </div>
        <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
      </div>
    </>
  );

  return (
    <div className="app">
      <aside className="sidebar hidden md:flex">
        {SidebarContent}
      </aside>

      <div className="main">
        <header className="topbar px-4 md:px-8">
          <div className="flex items-center gap-4 flex-1 md:flex-none">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger
                  render={
                    <button className="p-2 -ml-2 text-ink-500 hover:bg-ink-050 rounded-md transition-colors" />
                  }
                >
                  <Menu className="w-6 h-6" />
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px] border-r-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigasi</SheetTitle>
                  </SheetHeader>
                  <div className="sidebar !flex h-full">
                    {SidebarContent}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="topbar__crumb hidden md:flex">
              <span className="text-ink-400 hover:text-ink-700 cursor-pointer transition-colors">Angkasa</span>
              <ChevronRight className="w-3.5 h-3.5 text-ink-300" />
              <span className="topbar__crumb-active">{currentPageTitle}</span>
            </div>
            <div className="md:hidden font-bold text-ink-000 truncate">{currentPageTitle}</div>
          </div>

          <div className="topbar__actions flex-shrink-0">
            <div className="input__wrap group focus-within:ring-2 focus-within:ring-accent-100 transition-all hidden sm:flex" style={{ width: 280 }}>
              <Search className="input__icon group-focus-within:text-accent-700" />
              <input placeholder="Cari..." className="w-full" />
              <span className="badge badge--outline text-[10px] opacity-50 group-focus-within:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-mono)", padding: "0 5px", height: 16 }}>⌘K</span>
            </div>
            <button className="btn btn--ghost btn--sm hover:bg-ink-050 relative" title="Notifications" style={{ width: 36, padding: 0, height: 36 }}>
              <Bell className="btn__icon text-ink-500" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-neg-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="hidden lg:flex badge badge--outline bg-white/50 backdrop-blur-sm py-1 px-3 border-ink-100 shadow-sm">
              <span className="badge__dot animate-pulse bg-pos-500"></span>
              <span className="text-ink-500 font-medium ml-1">Live · WITA 10:24</span>
            </div>
          </div>
        </header>

        <div className="content-wrap overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
