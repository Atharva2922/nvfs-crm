"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Receipt, 
  TrendingDown, 
  TrendingUp, 
  IndianRupee, 
  ArrowLeftRight, 
  Settings 
} from "lucide-react";

interface NavTab {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_TABS: NavTab[] = [
  { label: "Overview", href: "/app/finance", icon: LayoutDashboard },
  { label: "Invoices", href: "/app/finance/invoices", icon: FileText },
  { label: "Payments", href: "/app/finance/payments", icon: CreditCard },
  { label: "Expenses", href: "/app/finance/expenses", icon: Receipt },
  { label: "Receivables", href: "/app/finance/receivables", icon: TrendingUp },
  { label: "Payables", href: "/app/finance/payables", icon: TrendingDown },
  { label: "Payroll", href: "/app/finance/payroll", icon: IndianRupee },
  { label: "Transactions", href: "/app/finance/transactions", icon: ArrowLeftRight },
  { label: "Settings", href: "/app/finance/settings", icon: Settings },
];

export function FinanceNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-zinc-800 pb-2 mb-6 scrollbar-none">
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/app/finance"
            ? pathname === "/app/finance"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
              isActive
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
