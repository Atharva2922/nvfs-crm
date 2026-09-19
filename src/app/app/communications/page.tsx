import { Metadata } from "next";
import { CommunicationHub } from "@/modules/communications/communication-hub";

export const metadata: Metadata = {
  title: "Communication & Collaboration Hub | NFVS CRM",
  description: "Centralized communication layer connected to CRM records, direct messaging, team channels, and company announcements.",
};

export default function CommunicationsPage() {
  return <CommunicationHub />;
}
