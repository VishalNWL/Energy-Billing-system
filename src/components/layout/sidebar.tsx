"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Gauge,
  FileText,
  Zap,
  TrendingUp,
  Sun,
  ClipboardList,
  Activity,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const adminNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Consumers",
    href: "/admin/consumers",
    icon: Users,
  },
  {
    label: "Meter Readings",
    href: "/admin/meter-readings",
    icon: Gauge,
  },
  {
    label: "Billing",
    href: "/admin/billing",
    icon: FileText,
  },
  {
    label: "Load Analysis",
    href: "/admin/load-analysis",
    icon: Activity,
  },
  {
    label: "Power Factor",
    icon: Zap,
    children: [
      { label: "Monitoring", href: "/admin/power-factor" },
      { label: "Correction Calculator", href: "/admin/pf-correction" },
    ],
  },
  {
    label: "Maximum Demand",
    href: "/admin/maximum-demand",
    icon: TrendingUp,
  },
  {
    label: "Solar Net Metering",
    icon: Sun,
    children: [
      { label: "Overview", href: "/admin/solar" },
      { label: "Register Plant", href: "/admin/solar/register" },
    ],
  },
  {
    label: "Energy Audit",
    href: "/admin/energy-audit",
    icon: ClipboardList,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: FileText,
  },
];

const engineerNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/engineer",
    icon: LayoutDashboard,
  },
  {
    label: "Consumers",
    href: "/admin/consumers",
    icon: Users,
  },
  {
    label: "Meter Readings",
    href: "/admin/meter-readings/select",
    icon: Gauge,
  },
  {
    label: "Billing",
    href: "/admin/billing",
    icon: FileText,
  },
  {
    label: "Load Analysis",
    href: "/admin/load-analysis",
    icon: Activity,
  },
  {
    label: "Power Factor",
    icon: Zap,
    children: [
      { label: "Monitoring", href: "/admin/power-factor" },
      { label: "Correction Calculator", href: "/admin/pf-correction" },
    ],
  },
  {
    label: "Maximum Demand",
    href: "/admin/maximum-demand",
    icon: TrendingUp,
  },
  {
    label: "Solar Net Metering",
    icon: Sun,
    children: [
      { label: "Overview", href: "/admin/solar" },
      { label: "Register Plant", href: "/admin/solar/register" },
    ],
  },
  {
    label: "Energy Audit",
    href: "/admin/energy-audit",
    icon: ClipboardList,
  },
];

const consumerNav: NavItem[] = [
  {
    label: "My Dashboard",
    href: "/consumer",
    icon: LayoutDashboard,
  },
];

interface SidebarProps {
  role: "ADMIN" | "ENGINEER" | "CONSUMER";
  userName: string;
}

function NavItemComponent({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </div>
          {open ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        {open && (
          <div className="ml-7 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === child.href
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        pathname === item.href || pathname.startsWith(item.href! + "/")
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar({ role, userName }: SidebarProps) {
  const nav =
    role === "ADMIN"
      ? adminNav
      : role === "ENGINEER"
      ? engineerNav
      : consumerNav;

  return (
    <aside className="w-64 shrink-0 border-r min-h-screen bg-background flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          <div>
            <p className="font-bold text-sm leading-tight">Smart Energy</p>
            <p className="text-xs text-muted-foreground leading-tight">
              Billing System
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-muted-foreground">Signed in as</p>
        <p className="text-sm font-medium truncate">{userName}</p>
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
          {role}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavItemComponent key={item.label} item={item} />
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t">
        <Link
          href="/sign-in"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
        >
          <Settings className="w-4 h-4" />
          Settings / Sign Out
        </Link>
      </div>
    </aside>
  );
}