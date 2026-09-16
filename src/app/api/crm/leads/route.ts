import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeadService } from "@/services/lead.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_OUTREACH", "CONFERENCE", "PARTNER"]).optional(),
  estimatedValue: z.number().optional(),
  ownerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get("status") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      search: searchParams.get("search") || undefined,
      scope: (searchParams.get("scope") as "my" | "all") || "all",
    };

    const leads = await LeadService.getLeads(user, filters);
    return successResponse({ leads });
  } catch (error: any) {
    console.error("[Leads GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve leads", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createLeadSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const lead = await LeadService.createLead(user, parse.data);
    return successResponse(lead, 201);
  } catch (error: any) {
    console.error("[Lead Create Error]:", error);
    return errorResponse(error.message || "Failed to capture lead", "LEAD_CREATE_FAILED", 400);
  }
}
