import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { OpportunityService } from "@/services/opportunity.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createOppSchema = z.object({
  name: z.string().min(3, "Opportunity name is required"),
  clientId: z.string().min(1, "Client is required"),
  contactId: z.string().optional(),
  value: z.number().min(0, "Contract value must be positive"),
  stage: z.enum(["DISCOVERY", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const filters = {
      stage: searchParams.get("stage") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      search: searchParams.get("search") || undefined,
      minValue: searchParams.has("minValue") ? parseFloat(searchParams.get("minValue")!) : undefined,
      maxValue: searchParams.has("maxValue") ? parseFloat(searchParams.get("maxValue")!) : undefined,
      minProbability: searchParams.has("minProbability") ? parseInt(searchParams.get("minProbability")!, 10) : undefined,
      maxProbability: searchParams.has("maxProbability") ? parseInt(searchParams.get("maxProbability")!, 10) : undefined,
      closeDatePreset: searchParams.get("closeDatePreset") || undefined,
      closeDateFrom: searchParams.get("closeDateFrom") || undefined,
      closeDateTo: searchParams.get("closeDateTo") || undefined,
      datePreset: searchParams.get("datePreset") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      scope: (searchParams.get("scope") as "my" | "all") || "all",
      page: searchParams.has("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
      limit: searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    const result = await OpportunityService.getOpportunities(user, filters);
    return successResponse(
      { opportunities: result.opportunities },
      200,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      } as any
    );
  } catch (error: any) {
    console.error("[Opportunities GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve opportunities", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createOppSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const opportunity = await OpportunityService.createOpportunity(user, parse.data);
    return successResponse(opportunity, 201);
  } catch (error: any) {
    console.error("[Opportunity Create Error]:", error);
    return errorResponse(error.message || "Failed to create opportunity", "OPPORTUNITY_CREATE_FAILED", 400);
  }
}
