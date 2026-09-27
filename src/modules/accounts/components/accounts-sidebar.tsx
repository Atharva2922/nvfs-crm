"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  IndianRupee,
  Landmark,
  BookOpenCheck,
  Percent,
  Package,
  FileBarChart,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Users,
  CheckSquare,
  Clock,
  Calendar,
  CalendarCheck,
  FileCheck,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

interface SubItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  href?: string;
  subItems?: SubItem[];
}

interface NavGroup {
  groupName: string;
  items: NavSection[];
}

export function AccountsSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Sales: false,
    Purchases: false,
    Accounting: false,
    Banking: false,
  });

  const { activeCompany, user: currentUser } = useAuth();
  const companyName = activeCompany?.name || "Apex Technologies";
  const companyCode = activeCompany?.code || "APEX";
  const primaryColor = activeCompany?.primaryColor || "#2563eb";
  const companyLogo =
    activeCompany?.logo ||
    (companyCode === "NFVS" || companyName.toLowerCase().includes("venture")
      ? "/logos/nfvs-logo.jpg"
      : companyCode === "NAREE" || companyName.toLowerCase().includes("naree")
      ? "/logos/naree-logo.jpg"
      : null);
  const companyInitials = companyName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const navGroups: NavGroup[] = [
    {
      groupName: "FINANCE TEAM",
      items: [
        {
          title: "Accounts & Books",
          icon: Landmark,
          href: "/app/accounts",
        },
        {
          title: "Finance Hub",
          icon: IndianRupee,
          href: "/app/finance",
        },
        {
          title: "Financial Tasks",
          icon: CheckSquare,
          href: "/app/tasks",
        },
        {
          title: "Sales",
          icon: ShoppingCart,
          subItems: [
            { title: "Customers", href: "/app/accounts/sales/customers" },
            { title: "Estimates", href: "/app/accounts/sales/estimates" },
            { title: "Sales Orders", href: "/app/accounts/sales/sales-orders" },
            { title: "Invoices", href: "/app/accounts/sales/invoices" },
            { title: "Recurring Invoices", href: "/app/accounts/sales/recurring-invoices" },
            { title: "Payments Received", href: "/app/accounts/sales/payments-received" },
            { title: "Credit Notes", href: "/app/accounts/sales/credit-notes" },
          ],
        },
        {
          title: "Purchases",
          icon: ShoppingBag,
          subItems: [
            { title: "Vendors", href: "/app/accounts/purchases/vendors" },
            { title: "Purchase Orders", href: "/app/accounts/purchases/purchase-orders" },
            { title: "Bills", href: "/app/accounts/purchases/bills" },
            { title: "Recurring Bills", href: "/app/accounts/purchases/recurring-bills" },
            { title: "Payments Made", href: "/app/accounts/purchases/payments-made" },
            { title: "Vendor Credits", href: "/app/accounts/purchases/vendor-credits" },
          ],
        },
        {
          title: "Expenses",
          icon: Receipt,
          subItems: [
            { title: "Expenses", href: "/app/accounts/expenses" },
            { title: "Expense Categories", href: "/app/accounts/expenses/categories" },
            { title: "Employee Expenses", href: "/app/accounts/expenses/employee-expenses" },
            { title: "Reimbursements", href: "/app/accounts/expenses/reimbursements" },
          ],
        },
        {
          title: "Banking",
          icon: Landmark,
          subItems: [
            { title: "Bank Accounts", href: "/app/accounts/banking/accounts" },
            { title: "Cash Accounts", href: "/app/accounts/banking/cash" },
            { title: "Bank Transactions", href: "/app/accounts/banking/transactions" },
            { title: "Bank Reconciliation", href: "/app/accounts/banking/reconciliation" },
            { title: "Transfers", href: "/app/accounts/banking/transfers" },
          ],
        },
        {
          title: "Double-Entry Ledger",
          icon: BookOpenCheck,
          subItems: [
            { title: "Chart of Accounts", href: "/app/accounts/accounting/chart-of-accounts" },
            { title: "Journal Entries", href: "/app/accounts/accounting/journals" },
            { title: "General Ledger", href: "/app/accounts/accounting/general-ledger" },
            { title: "Trial Balance", href: "/app/accounts/accounting/trial-balance" },
            { title: "Opening Balances", href: "/app/accounts/accounting/opening-balances" },
          ],
        },
        {
          title: "Tax / GST",
          icon: Percent,
          subItems: [
            { title: "Tax Rates", href: "/app/accounts/tax/rates" },
            { title: "GST Configuration", href: "/app/accounts/tax/gst-config" },
            { title: "GST Transactions", href: "/app/accounts/tax/gst-transactions" },
            { title: "GST Reports", href: "/app/accounts/tax/gst-reports" },
            { title: "Tax Summary", href: "/app/accounts/tax/summary" },
          ],
        },
        {
          title: "Inventory",
          icon: Package,
          subItems: [
            { title: "Items", href: "/app/accounts/inventory/items" },
            { title: "Item Groups", href: "/app/accounts/inventory/item-groups" },
            { title: "Stock", href: "/app/accounts/inventory/stock" },
            { title: "Warehouses", href: "/app/accounts/inventory/warehouses" },
            { title: "Stock Adjustments", href: "/app/accounts/inventory/adjustments" },
            { title: "Inventory Valuation", href: "/app/accounts/inventory/valuation" },
          ],
        },
        {
          title: "Financial Reports",
          icon: FileBarChart,
          subItems: [
            { title: "Profit & Loss", href: "/app/accounts/reports/profit-loss" },
            { title: "Balance Sheet", href: "/app/accounts/reports/balance-sheet" },
            { title: "Cash Flow Statement", href: "/app/accounts/reports/cash-flow" },
            { title: "General Ledger", href: "/app/accounts/reports/general-ledger" },
            { title: "Trial Balance", href: "/app/accounts/reports/trial-balance" },
            { title: "Accounts Receivable", href: "/app/accounts/reports/receivables" },
            { title: "Accounts Payable", href: "/app/accounts/reports/payables" },
            { title: "Sales Report", href: "/app/accounts/reports/sales" },
            { title: "Purchase Report", href: "/app/accounts/reports/purchases" },
            { title: "Expense Report", href: "/app/accounts/reports/expenses" },
            { title: "Tax / GST Reports", href: "/app/accounts/reports/tax" },
            { title: "Inventory Reports", href: "/app/accounts/reports/inventory" },
          ],
        },
        {
          title: "Accounts Settings",
          icon: Settings,
          subItems: [
            { title: "Organization", href: "/app/accounts/settings/organization" },
            { title: "Financial Year", href: "/app/accounts/settings/financial-year" },
            { title: "Currency", href: "/app/accounts/settings/currency" },
            { title: "Taxes", href: "/app/accounts/settings/taxes" },
            { title: "Invoice Settings", href: "/app/accounts/settings/invoices" },
            { title: "Numbering", href: "/app/accounts/settings/numbering" },
            { title: "Payment Terms", href: "/app/accounts/settings/payment-terms" },
            { title: "Payment Methods", href: "/app/accounts/settings/payment-methods" },
            { title: "Bank Accounts", href: "/app/accounts/settings/bank-accounts" },
            { title: "Templates", href: "/app/accounts/settings/templates" },
            { title: "Preferences", href: "/app/accounts/settings/preferences" },
            { title: "Automation", href: "/app/accounts/settings/automation" },
            { title: "User Permissions", href: "/app/accounts/settings/permissions" },
            { title: "Audit Logs", href: "/app/accounts/settings/audit-logs" },
          ],
        },
      ],
    },
    {
      groupName: "MY WORKSPACE",
      items: [
        { title: "Workspace Overview", href: "/app/overview", icon: LayoutDashboard },
        { title: "My Tasks", href: "/app/tasks", icon: CheckSquare },
        { title: "My Attendance", href: "/app/hr/attendance", icon: Clock },
        { title: "My Leave", href: "/app/hr/leaves", icon: CalendarCheck },
        { title: "My Salary & Payslips", href: "/app/payroll/my-payslips", icon: FileCheck },
        { title: "My Documents", href: "/app/documents", icon: FileText },
        { title: "Request Center", href: "/app/requests", icon: MessageSquare },
        { title: "AI Intelligence", href: "/app/ai", icon: Sparkles },
        { title: "Communications", href: "/app/communications", icon: MessageSquare },
        { title: "Calendar", href: "/app/calendar", icon: Calendar },
        { title: "Personal Settings", href: "/app/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] text-slate-700 dark:text-slate-200 transition-all duration-200 ease-in-out select-none z-30 font-sans",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand & Organization Header - Exactly identical to CRM */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-slate-200 dark:border-slate-800/80">
        <Link href="/app/overview" className="flex items-center gap-2.5 overflow-hidden">
          {companyLogo ? (
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white p-0.5 shadow-sm">
              <img
                src={companyLogo}
                alt={companyName}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-bold text-sm text-white shadow-md transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              {companyInitials || "CR"}
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
                {companyName}
              </span>
              <span
                className="text-[10px] font-mono tracking-wider truncate font-semibold"
                style={{ color: primaryColor }}
              >
                {companyCode}
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                {group.groupName}
              </div>
            )}
            {group.items.map((sec) => {
              const Icon = sec.icon;
              const hasSubItems = Boolean(sec.subItems && sec.subItems.length > 0);
              const isOpen = openSections[sec.title] ?? false;
              const isSectionActive =
                sec.href === pathname ||
                (sec.href && sec.href !== "/app/overview" && pathname.startsWith(sec.href)) ||
                sec.subItems?.some((sub) => pathname === sub.href);

              if (collapsed) {
                return (
                  <div key={sec.title} className="relative group">
                    <Link
                      href={sec.href || sec.subItems?.[0]?.href || "/app/accounts"}
                      className={cn(
                        "flex h-9 w-9 mx-auto items-center justify-center rounded-md transition-colors",
                        isSectionActive
                          ? "bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-semibold shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                      title={sec.title}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  </div>
                );
              }

              if (!hasSubItems && sec.href) {
                return (
                  <Link
                    key={sec.title}
                    href={sec.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      isSectionActive
                        ? "bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-semibold shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isSectionActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                      )}
                    />
                    <span className="truncate">{sec.title}</span>
                  </Link>
                );
              }

              return (
                <div key={sec.title} className="space-y-0.5">
                  <button
                    onClick={() => toggleSection(sec.title)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      isSectionActive
                        ? "text-blue-700 dark:text-blue-300 font-semibold bg-blue-600/15 border border-blue-500/30"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSectionActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                        )}
                      />
                      <span>{sec.title}</span>
                    </div>
                    <div className="text-slate-400 dark:text-slate-500">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </div>
                  </button>

                  {isOpen && sec.subItems && (
                    <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-slate-200 dark:border-slate-800 ml-4">
                      {sec.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "block rounded px-2 py-1 text-[11px] transition-colors truncate",
                              isSubActive
                                ? "bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500 pl-1.5"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                            )}
                          >
                            {sub.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tenant Boundary & Role Footer - Exactly identical to CRM */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate max-w-[130px]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="truncate font-medium">{companyName}</span>
            </div>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-mono font-medium"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                border: `1px solid ${primaryColor}35`,
              }}
            >
              {currentUser?.employee?.designation || "Accountant"}
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title={`${companyName} Active`}>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
