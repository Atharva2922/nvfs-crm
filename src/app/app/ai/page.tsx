import { Metadata } from "next";
import { AIAssistantPage } from "@/modules/ai/ai-assistant-page";

export const metadata: Metadata = {
  title: "AI Layer & Executive Intelligence | NFVS CRM",
  description: "Enterprise intelligence layer providing role-aware business insights, record summarization, anomaly detection, and action verification.",
};

export default function AIPage() {
  return <AIAssistantPage />;
}
