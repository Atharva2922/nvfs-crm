"use client";

import { useEffect, useState, useTransition } from "react";
import { FinanceNav } from "@/modules/finance/components/finance-nav";
import { 
  Settings, 
  IndianRupee, 
  Globe, 
  FileText, 
  Percent, 
  CheckCircle2, 
  AlertCircle,
  Save
} from "lucide-react";

interface FinanceSettingsData {
  baseCurrency: string;
  supportedCurrencies: string[];
  defaultPaymentTerms: string;
  defaultTaxRate: number;
  invoicePrefix: string;
}

const ALL_CURRENCIES = [
  { code: "INR", name: "Indian Rupee (₹)" },
  { code: "USD", name: "United States Dollar ($)" },
  { code: "EUR", name: "Euro (€)" },
  { code: "GBP", name: "British Pound (£)" },
];

export default function FinanceSettingsPage() {
  const [settings, setSettings] = useState<FinanceSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(["INR", "USD", "EUR", "GBP"]);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("");
  const [defaultTaxRate, setDefaultTaxRate] = useState("10");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/settings");
      if (res.ok) {
        const json = await res.json();
        const data = json.data as FinanceSettingsData;
        setSettings(data);
        setBaseCurrency(data.baseCurrency);
        setSupportedCurrencies(data.supportedCurrencies);
        setDefaultPaymentTerms(data.defaultPaymentTerms);
        setDefaultTaxRate(String(data.defaultTaxRate));
        setInvoicePrefix(data.invoicePrefix);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCurrencyToggle = (code: string) => {
    if (supportedCurrencies.includes(code)) {
      if (supportedCurrencies.length > 1 && code !== baseCurrency) {
        setSupportedCurrencies(supportedCurrencies.filter((c) => c !== code));
      }
    } else {
      setSupportedCurrencies([...supportedCurrencies, code]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMsg("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/finance/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseCurrency,
            supportedCurrencies,
            defaultPaymentTerms,
            defaultTaxRate: parseFloat(defaultTaxRate) || 0,
            invoicePrefix,
          }),
        });

        if (res.ok) {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 4000);
        } else {
          const json = await res.json();
          setErrorMsg(json.error?.message || "Failed to update financial settings");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Network error");
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <FinanceNav />
        <div className="p-12 text-center text-zinc-500">Loading financial configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Financial Configuration</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure enterprise base currencies, multi-currency support, tax percentages, and default commercial invoice terms.
          </p>
        </div>
      </div>

      {/* Sub-Navigation */}
      <FinanceNav />

      {savedSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Financial configuration successfully updated and audited!</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Form Card */}
      <form onSubmit={handleSave} className="max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        {/* Base Currency */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Base Reporting Currency
          </label>
          <p className="text-xs text-zinc-500 mt-0.5">
            Default monetary unit for general ledger balances and financial statements.
          </p>
          <select
            value={baseCurrency}
            onChange={(e) => {
              setBaseCurrency(e.target.value);
              if (!supportedCurrencies.includes(e.target.value)) {
                setSupportedCurrencies([...supportedCurrencies, e.target.value]);
              }
            }}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Supported Multi-Currencies */}
        <div className="pt-4 border-t border-zinc-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Active Supported Currencies
          </label>
          <p className="text-xs text-zinc-500 mt-0.5">
            Currencies available for commercial invoicing and payments (minimum USD, INR, EUR, GBP).
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {ALL_CURRENCIES.map((c) => (
              <label
                key={c.code}
                className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 cursor-pointer hover:border-zinc-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={supportedCurrencies.includes(c.code)}
                  onChange={() => handleCurrencyToggle(c.code)}
                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-white">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Default Tax Rate & Prefix */}
        <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Default Commercial Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Invoice Code Prefix
            </label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Default Payment Terms */}
        <div className="pt-4 border-t border-zinc-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Standard Payment Terms
          </label>
          <textarea
            rows={3}
            value={defaultPaymentTerms}
            onChange={(e) => setDefaultPaymentTerms(e.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
