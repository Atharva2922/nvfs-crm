import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DashboardCfoRedirectPage() {
  redirect("/app/dashboard/cfo");
}
