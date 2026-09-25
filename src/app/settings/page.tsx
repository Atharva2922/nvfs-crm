import { redirect } from "next/navigation";

export default async function SettingsRedirectPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams.category === "string" ? searchParams.category : "";
  if (category) {
    redirect(`/app/settings?category=${category}`);
  }
  redirect("/app/settings");
}
