import { AISourceRecord } from "./ai-tools";

export interface AIActionPreview {
  actionType: "CREATE_TASK" | "ASSIGN_LEAD" | "CREATE_APPROVAL" | "ESCALATE_INVOICE" | "SEND_NOTIFICATION";
  title: string;
  description: string;
  targetRecordId?: string;
  targetRecordType?: string;
  assigneeName?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  sourceContext?: string;
}

export interface AIResponsePayload {
  content: string;
  sources: AISourceRecord[];
  actionPreview?: AIActionPreview | null;
  limitationsNote?: string;
}

export interface RecordSummaryPayload {
  headline: string;
  keyStatus: string;
  highlights: string[];
  risks: string[];
  recommendedActions: string[];
  sources: AISourceRecord[];
}

export interface AIAdvisorPayload {
  headline: string;
  observations: Array<{
    category: "REVENUE" | "OPERATIONS" | "CLIENTS" | "RISK" | "EFFICIENCY";
    title: string;
    description: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
  }>;
  anomalies: Array<{
    metric: string;
    detectedChange: string;
    causeHypothesis?: string;
  }>;
  actionRecommendations: AIActionPreview[];
  sources: AISourceRecord[];
}

export interface AIProvider {
  providerName: string;
  generateResponse(input: {
    userRole: string;
    query: string;
    retrievedData: any;
    conversationHistory?: Array<{ role: string; content: string }>;
    contextRecord?: { type: string; id: string; data: any };
  }): Promise<AIResponsePayload>;

  summarizeRecord(recordType: string, recordData: any): Promise<RecordSummaryPayload>;

  generateExecutiveAdvice(userRole: string, metrics: any): Promise<AIAdvisorPayload>;
}
