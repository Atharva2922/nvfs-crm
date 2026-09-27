import React from "react";
import { AccountsLayout } from "@/modules/accounts/components/accounts-layout";

export const dynamic = "force-dynamic";

export default function AccountsModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountsLayout>{children}</AccountsLayout>;
}
