import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "#/lib/utils";
import {
  ShieldCheck,
  LogOut,
  GaugeIcon,
  Truck,
  Contact,
  Warehouse,
  Package,
  FileText,
  Users,
  Ticket,
  Fuel,
  Landmark,
  BarChart3,
  Receipt,
  Building2,
  ShoppingBag,
  PlusCircle,
  DollarSign,
} from "lucide-react";
import { useAuthStore, useAdminLogout } from "#/modules/auth";
import { useLayoutStore } from "#/stores/layoutStore";

type NavItem = {
  title: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  path: string;
};

type NavCategory = {
  category: string;
  items: NavItem[];
};

const navCategories: NavCategory[] = [
  {
    category: "", // Overview
    items: [{ title: "Overview", icon: GaugeIcon, path: "/overview" }],
  },
  {
    category: "Orders",
    items: [
      { title: "Orders", icon: ShoppingBag, path: "/orders" },
      { title: "Create Order", icon: PlusCircle, path: "/admin-order" },
      { title: "Our Customers", icon: Building2, path: "/customers" },
    ],
  },

  {
    category: "Dangote Delivery",
    items: [
      { title: "Dangote Orders", icon: ShoppingBag, path: "/dangote-orders" },
      {
        title: "Order Requests",
        icon: FileText,
        path: "/dangote-order-request",
      },
      { title: "Dangote Products", icon: Package, path: "/dangote-products" },
    ],
  },
  {
    category: "Operations",
    items: [
      { title: "Loading Tickets", icon: Ticket, path: "/ticket" },
      { title: "Depots", icon: Warehouse, path: "/depots" },
      { title: "Product Pricing", icon: Fuel, path: "/product-pricing" },
      { title: "Products", icon: Package, path: "/products" },
    ],
  },
  {
    category: "Finance",
    items: [
      { title: "Deposits", icon: Receipt, path: "/deposits" },
      { title: "Bank Accounts", icon: Landmark, path: "/bank-accounts" },
      { title: "Commissions", icon: DollarSign, path: "/commissions" },
    ],
  },
  {
    category: "Transport",
    items: [
      { title: "Fleet Directory", icon: Truck, path: "/trucks" },
      { title: "Drivers Directory", icon: Contact, path: "/drivers" },
    ],
  },
  {
    category: "Truck Sales",
    items: [
      {
        title: "Delivery Operations",
        icon: Truck,
        path: "/delivery-operations",
      },
      { title: "Sales Ledger", icon: BarChart3, path: "/sales-ledger" },
      { title: "Filling Stations", icon: Fuel, path: "/filing-stations" },
      { title: "Delivery Customers", icon: Users, path: "/delivery-customer" },
    ],
  },

  {
    category: "Admin",
    items: [
      { title: "PFI Tracking", icon: FileText, path: "/pfi" },
      { title: "Admin Settings", icon: ShieldCheck, path: "/admin" },
    ],
  },
];

function NavGroup({
  label,
  items,
  expanded,
  location,
  onItemClick,
}: {
  label: string;
  items: NavItem[];
  expanded: boolean;
  location: { pathname: string };
  onItemClick: () => void;
}) {
  return (
    <div className="mb-2">
      {label && expanded && (
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/40 select-none">
          {label}
        </div>
      )}
      {label && !expanded && (
        <div className="mx-auto my-2 h-px w-6 border-t border-white/10" />
      )}
      {items.map((item) => {
        const isActive =
          location.pathname === item.path ||
          location.pathname.startsWith(item.path + "/");

        return (
          <Link
            key={item.title}
            to={item.path as any}
            onClick={onItemClick}
            className={cn(
              "group flex items-center rounded-lg text-sm h-10 transition-all duration-200 cursor-pointer relative mx-1",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0",
              expanded ? "gap-3 px-3" : "justify-center px-0",
              isActive
                ? "bg-white/10 text-white font-semibold shadow-sm"
                : "text-white/80 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent",
            )}
            title={expanded ? undefined : item.title}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon
              size={18}
              className={cn(
                "shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? "text-white"
                  : "text-white/70 group-hover:text-white",
              )}
            />

            {expanded && (
              <span className="min-w-0 flex-1 truncate font-medium">
                {item.title}
              </span>
            )}

            {!expanded && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-white/10 text-white border border-white/10 backdrop-blur-md text-xs rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 ease-out group-hover:scale-100 scale-95 whitespace-nowrap z-50 shadow-md">
                {item.title}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const { isCollapsed, isMobileOpen, setMobileOpen } = useLayoutStore();
  const expanded = !isCollapsed;
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useAdminLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Clear local state even if endpoint fails
    }
    window.location.href = "/login";
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.surname?.[0] || ""}`.toUpperCase()
    : "AH";

  const displayName = user ? `${user.firstName} ${user.surname}` : "Admin";

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r overflow-hidden",
          "bg-sidebar-background text-sidebar-foreground border-sidebar-border",
          "transition-[width] duration-300 ease-in-out",
          "shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_22px_44px_rgba(30,90,72,0.06)]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          expanded ? "w-64" : "w-[72px]",
        )}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div
            className={cn(
              "flex items-center gap-3 min-w-0",
              !expanded && "justify-center flex-1",
            )}
            title={expanded ? undefined : "Soroman"}
          >
            <img
              src="/logo.png"
              alt="Soroman"
              className={cn("shrink-0", expanded ? "w-9 h-9" : "w-8 h-8")}
            />
            {expanded && (
              <div className="min-w-0 leading-tight">
                <div className="font-semibold text-sm tracking-tight text-white">
                  Soroman
                </div>
                <div className="text-[11px] text-white/60">Dashboard</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Categories */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          aria-label="Primary"
        >
          {navCategories.map((group) => (
            <NavGroup
              key={group.category || "__overview"}
              label={group.category}
              items={group.items}
              expanded={expanded}
              location={location}
              onItemClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* User / Logout Footer */}
        <div className="border-t border-white/10 p-3 shrink-0">
          {expanded ? (
            <div className="mb-3 flex items-center gap-3 px-2 rounded-lg py-1.5">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">
                  {displayName}
                </div>
                <div className="truncate text-xs text-white/60">
                  {user?.email || "admin"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {initials}
              </div>
            </div>
          )}

          <button
            type="button"
            className={cn(
              "h-10 w-full rounded-lg flex items-center transition-all cursor-pointer font-medium text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
              expanded ? "justify-start gap-2 px-3" : "justify-center px-0",
              "text-red-300 hover:text-red-200 hover:bg-red-500/10",
            )}
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} className="shrink-0 text-red-300" />
            {expanded && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
