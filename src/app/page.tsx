import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) {
    const designation = (user.employee?.designation || "").trim().toLowerCase();
    if (
      designation.includes("accountant") ||
      designation.includes("accounts") ||
      (user.roleCode as string) === "ACCOUNTANT"
    ) {
      redirect("/app/accounts");
    }
  }
  redirect("/app/overview");
}
