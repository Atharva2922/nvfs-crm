import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM + NFVS | Enterprise Business Management",
  description: "Unified enterprise platform for CRM, HR, Finance, Operations, Invoicing, Legal, and Executive Oversight.",
};

// Inline theme-init snippet — kept here to guarantee it runs before paint
// without going through React hydration (avoids the React 19 <script> warning).
const THEME_INIT_SCRIPT = `try{var stored=localStorage.getItem('nfvs_theme_preference');var isDark=stored==='dark'||(!stored&&true)||(stored==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      {/* Script placed in <head> so Next.js SSR injects it before hydration
          without React trying to reconcile it on the client side. */}
      <head>
        <script
          id="nfvs-theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#070b16] text-slate-900 dark:text-slate-100 selection:bg-blue-700 selection:text-amber-100 transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
