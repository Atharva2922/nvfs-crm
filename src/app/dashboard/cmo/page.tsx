import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DashboardCmoRedirectPage() {
  redirect("/app/dashboard/cmo");
}
