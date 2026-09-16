"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Briefcase,
  FolderTree,
  Boxes,
  Building2,
  ArrowLeftRight,
  Sliders,
  Truck,
  FileSpreadsheet,
  ClipboardList,
  PackageCheck,
  Settings,
} from "lucide-react";

interface NavTab {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_TABS: NavTab[] = [
  { label: "Overview", href: "/app/inventory", icon: LayoutDashboard },
  { label: "Products", href: "/app/inventory/products", icon: Package },
  { label: "Services", href: "/app/inventory/services", icon: Briefcase },
  { label: "Categories", href: "/app/inventory/categories", icon: FolderTree },
  { label: "Stock Matrix", href: "/app/inventory/stock", icon: Boxes },
  { label: "Warehouses", href: "/app/inventory/warehouses", icon: Building2 },
  { label: "Movements", href: "/app/inventory/movements", icon: ArrowLeftRight },
  { label: "Adjustments", href: "/app/inventory/adjustments", icon: Sliders },
  { label: "Vendors", href: "/app/inventory/vendors", icon: Truck },
  { label: "Purchase Requests", href: "/app/inventory/purchase-requests", icon: ClipboardList },
  { label: "Purchase Orders", href: "/app/inventory/purchase-orders", icon: FileSpreadsheet },
  { label: "Goods Receipts", href: "/app/inventory/goods-receipts", icon: PackageCheck },
  { label: "Settings", href: "/app/inventory/settings", icon: Settings },
];

export function InventoryNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-zinc-800 pb-2 mb-6 scrollbar-none">
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/app/inventory"
            ? pathname === "/app/inventory"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
              isActive
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
