import React, { useMemo } from "react";
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
  FileSpreadsheet,
  LogIn,
  ClipboardList,
  Flame,
  Percent,
  Home,
  MessageSquare,
} from "lucide-react";
import { useAuthStore, useAdminLogout } from "#/modules/auth";
import { useLayoutStore } from "#/stores/layoutStore";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { useRoles } from "#/lib/hooks/useRoles";
import { canAccessRoute, isSuperAdmin } from "#/lib/rbac";

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
    category: "", // Top of nav — no header
    items: [
      { title: "Home", icon: Home, path: "/home" },
      { title: "Overview", icon: GaugeIcon, path: "/overview" },
    ],
  },
  {
    category: "Orders",
    items: [
      { title: "All Orders", icon: ShoppingBag, path: "/orders" },
      { title: "Create Order", icon: PlusCircle, path: "/admin-order" },
      // Two role-specific order views. Both are titled "Orders" upstream;
      // named for their audience here so a SuperAdmin, who sees both, can
      // tell them apart.
      { title: "Marketing Orders", icon: ShoppingBag, path: "/sales-manager-view" },
      { title: "Location Orders", icon: ShoppingBag, path: "/product-manager-view" },
      { title: "Our Customers", icon: Building2, path: "/customers" },
      { title: "Customer Desk", icon: Contact, path: "/customer-desk" },
    ],
  },
  {
    category: "My Reports",
    items: [{ title: "My Report", icon: FileText, path: "/my-report" }],
  },
  {
    category: "Operations",
    items: [
      { title: "Loading Tickets", icon: Ticket, path: "/ticket" },
      { title: "Gate Entry", icon: LogIn, path: "/security/entry" },
      { title: "Gate Exit", icon: LogOut, path: "/security/exit" },
      { title: "Security Report", icon: ClipboardList, path: "/security-report" },
      { title: "Depots", icon: Warehouse, path: "/depots" },
      { title: "Products", icon: Package, path: "/products" },
    ],
  },
  {
    category: "Finance",
    items: [
      { title: "Verify Payments", icon: ShieldCheck, path: "/payment-verify" },
      { title: "Finance Report", icon: FileSpreadsheet, path: "/confirmed-payments" },
      { title: "Deposits", icon: Receipt, path: "/deposits" },
      { title: "Overpayment Refunds", icon: DollarSign, path: "/overpayment-refunds" },
      { title: "Transfer Requests", icon: DollarSign, path: "/overpayment-requests" },
      { title: "Customer Commissions", icon: DollarSign, path: "/commissions" },
      { title: "Commission Rates", icon: Percent, path: "/commission-rates" },
      { title: "Bank Accounts", icon: Landmark, path: "/bank-accounts" },
      { title: "Bank Statements", icon: FileSpreadsheet, path: "/bank-statements" },
    ],
  },
  {
    category: "Transport",
    items: [
      { title: "Fleet Directory", icon: Truck, path: "/fleet-trucks" },
      { title: "Fleet Expense Ledger", icon: BarChart3, path: "/fleet-ledger" },
      { title: "Drivers Directory", icon: Contact, path: "/drivers" },
    ],
  },
  {
    category: "LPG Division",
    items: [
      { title: "LPG Division", icon: Flame, path: "/lpg" },
      { title: "LPG Dashboard", icon: GaugeIcon, path: "/lpg/dashboard" },
      { title: "LPG Plants", icon: Warehouse, path: "/lpg/plants" },
      { title: "LPG Stock Register", icon: Package, path: "/lpg/stock" },
      { title: "LPG Sales Register", icon: BarChart3, path: "/lpg/sales" },
    ],
  },
  {
    category: "LPG Home Delivery",
    items: [
      { title: "LPG Stations", icon: Flame, path: "/lpg-stations" },
      { title: "LPG Orders", icon: ShoppingBag, path: "/lpg-orders" },
      { title: "Order Requests", icon: FileText, path: "/lpg-order-request" },
    ],
  },
  {
    category: "Dangote Delivery",
    items: [
      { title: "Dangote Orders", icon: ShoppingBag, path: "/dangote-orders" },
      { title: "Order Requests", icon: FileText, path: "/dangote-order-request" },
      { title: "Dangote Products", icon: Package, path: "/dangote-products" },
    ],
  },
  {
    category: "Truck Sales",
    items: [
      { title: "Delivery Inventory", icon: Package, path: "/delivery-inventory" },
      { title: "Delivery Operations", icon: Truck, path: "/delivery-operations" },
      { title: "Delivery Customers", icon: Users, path: "/delivery-customer" },
      { title: "Sales Ledger", icon: BarChart3, path: "/sales-ledger" },
      { title: "Filling Stations", icon: Fuel, path: "/filing-stations" },
    ],
  },
  {
    category: "Admin",
    items: [
      { title: "Reports Hub", icon: FileSpreadsheet, path: "/admin-reports" },
      { title: "Messaging", icon: FileText, path: "/messaging" },
      { title: "Assign PFI", icon: FileText, path: "/orders-pfi" },
      { title: "Product Pricing", icon: Fuel, path: "/product-pricing" },
      { title: "PFI Tracking", icon: FileText, path: "/pfi" },
      { title: "Expenses", icon: Receipt, path: "/expenses" },
      { title: "Stock Management", icon: Package, path: "/inventory" },
      { title: "Users Log", icon: ClipboardList, path: "/order-audit" },
      { title: "Manage Users", icon: Users, path: "/admin" },
      { title: "Licence Verification", icon: ShieldCheck, path: "/licence-verification" },
    ],
  },
  {
    category: "Feedback",
    items: [{ title: "Feedback & Reviews", icon: MessageSquare, path: "/feedback-dashboard" }],
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
        <div className="px-3 py-2 text-xs uppercase text-muted-foreground/70 select-none">
          {label}
        </div>
      )}
      {label && !expanded && (
        <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" />
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
              "group relative mx-1 flex h-8 cursor-pointer items-center rounded-lg text-sm transition-colors duration-250 ease-luxe outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
              expanded ? "gap-3 px-3" : "justify-center px-0",
              // Emerald marks the active item; everything else stays neutral.
              isActive
                ? "bg-sidebar-accent font-normal text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-sidebar-primary" : "text-muted-foreground",
              )}
            />

            {expanded && (
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
            )}

            {/* Collapsed rail needs the label on hover; inverted, like the
                Tooltip primitive. Also fires on keyboard focus. */}
            {!expanded && (
              <>
                <span className="sr-only">{item.title}</span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-full z-50 ml-3 scale-95 rounded-md bg-foreground px-3 py-1.5 text-xs whitespace-nowrap text-background opacity-0 transition-all duration-200 ease-luxe group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                >
                  {item.title}
                </span>
              </>
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
  const { userRoles } = useRoles();

  // Filter navigation categories based on user roles
  const filteredNavCategories = useMemo(() => {
    // SUPERADMIN sees everything
    if (isSuperAdmin(userRoles)) return navCategories;

    return navCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          canAccessRoute(userRoles, item.path)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [userRoles]);

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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-luxe md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-r",
          "border-sidebar-border bg-sidebar text-sidebar-foreground",
          // The guide drives sidebar width at 200ms on a linear curve — the
          // one place in the system that isn't ease-luxe.
          "transition-[width] duration-200 ease-linear",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          expanded ? "w-64" : "w-12",
        )}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
          <div
            className={cn(
              "flex min-w-0 items-center gap-2.5",
              !expanded && "flex-1 justify-center",
            )}
          >
            <img
              src="/logo.png"
              alt=""
              aria-hidden
              className="size-6 shrink-0"
            />
            {expanded && (
              <span className="min-w-0 truncate text-sm font-normal tracking-tight">
                Soroman
              </span>
            )}
          </div>
        </div>

        {/* Navigation Categories */}
        <nav
          className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto py-3"
          aria-label="Primary"
        >
          {filteredNavCategories.map((group) => (
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
        <div className="shrink-0 border-t border-sidebar-border p-2">
          {expanded ? (
            <div className="mb-2 flex items-center gap-2.5 rounded-lg px-1 py-1.5">
              <Avatar>
                <AvatarFallback className="text-xs font-normal">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-normal">{displayName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {user?.email || "admin"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-2 flex justify-center">
              <Avatar>
                <AvatarFallback className="text-xs font-normal">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Tinted, never solid red. */}
          <button
            type="button"
            className={cn(
              "flex h-8 w-full cursor-pointer items-center rounded-lg text-sm font-normal",
              "text-destructive transition-colors duration-250 ease-luxe outline-none",
              "hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-destructive/20",
              expanded ? "justify-start gap-2 px-3" : "justify-center px-0",
            )}
            onClick={handleLogout}
          >
            <LogOut className="size-4 shrink-0" />
            {expanded ? <span>Logout</span> : <span className="sr-only">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
