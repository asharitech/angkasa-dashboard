"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const router = useRouter();

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
        className={cn("nav-item", active && "is-active")}
      >
        <Icon className="nav-item__icon" />
        <span>{label}</span>
        {badge ? <span className="nav-item__badge">{badge}</span> : null}
      </Link>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
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

        <div className="sidebar__footer">
          <div className="avatar">AG</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar__user-name">Angkasa</div>
            <div className="sidebar__user-role">Admin</div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__crumb">
            <span>Angkasa</span>
            <ChevronRight className="input__icon" />
            <span className="topbar__crumb-active">{currentPageTitle}</span>
          </div>
          <div className="topbar__actions">
            <div className="input__wrap" style={{ width: 260 }}>
              <Search className="input__icon" />
              <input placeholder="Cari transaksi, lokasi, orang…" />
              <span className="badge badge--outline" style={{ fontFamily: "var(--font-mono)", padding: "0 5px", height: 16 }}>⌘K</span>
            </div>
            <button className="btn btn--ghost btn--sm" title="Notifications" style={{ width: 32, padding: 0, height: 32 }}>
              <Bell className="btn__icon" />
            </button>
            <div className="badge badge--outline">
              <span className="badge__dot" style={{ color: "var(--pos-500)" }}></span>
              Live · WITA 10:24
            </div>
          </div>
        </header>

        <div className="content-wrap">
          {children}
        </div>
      </div>
    </div>
  );
}
