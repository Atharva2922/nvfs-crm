import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AITools, AISourceRecord } from "@/services/ai/ai-tools";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const validated = searchSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(validated.error.issues[0]?.message || "Invalid payload", "BAD_REQUEST", 400);
    }

    const q = validated.data.query.toLowerCase();
    const sources: AISourceRecord[] = [];
    const matchedFilters: string[] = [];

    // Parse intent
    if (q.includes("delayed") || q.includes("project") || q.includes("operation")) {
      matchedFilters.push("Operations: delayedOnly = true");
      const res = await AITools.getProjects(user, { delayedOnly: q.includes("delayed") });
      sources.push(...res.sources);
    }
    if (q.includes("overdue") || q.includes("invoice") || q.includes("unpaid")) {
      try {
        matchedFilters.push("Invoices: overdueOnly = true");
        const res = await AITools.getInvoices(user, { overdueOnly: true });
        sources.push(...res.sources);
      } catch {}
    }
    if (q.includes("lead") || q.includes("prospect")) {
      matchedFilters.push("Leads: recent active");
      const res = await AITools.getLeads(user);
      sources.push(...res.sources);
    }
    if (q.includes("client") || q.includes("inactive") || q.includes("account")) {
      matchedFilters.push("Clients: general search");
      const res = await AITools.getClients(user);
      sources.push(...res.sources);
    }
    if (q.includes("task") || q.includes("todo") || sources.length === 0) {
      matchedFilters.push("Tasks: priority lookup");
      const res = await AITools.getTasks(user, { overdueOnly: q.includes("overdue") });
      sources.push(...res.sources);
    }

    return successResponse({
      query: validated.data.query,
      appliedFilters: matchedFilters,
      totalMatches: sources.length,
      sources: sources.slice(0, 15),
    }, 200);
  } catch (error: any) {
    console.error("POST /api/ai/search error:", error);
    return errorResponse(error.message || "Search failed", "INTERNAL_ERROR", 500);
  }
}
