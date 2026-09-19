import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ClientService } from "@/services/client.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  status: z.enum(["LEAD", "PROSPECT", "ACTIVE", "INACTIVE", "CHURNED"]).optional(),
  tier: z.enum(["ENTERPRISE", "MID_MARKET", "SMB"]).optional(),
  ownerId: z.string().optional(),
  annualRevenue: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get("status") || undefined,
      tier: searchParams.get("tier") || undefined,
      industry: searchParams.get("industry") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      search: searchParams.get("search") || undefined,
      datePreset: searchParams.get("datePreset") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      scope: (searchParams.get("scope") as "my" | "all") || "all",
      page: searchParams.has("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
      limit: searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    const result = await ClientService.getClients(user, filters);
    return successResponse(
      { clients: result.clients },
      200,
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      } as any
    );
  } catch (error: any) {
    console.error("[CRM Clients GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve clients", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createClientSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const client = await ClientService.createClient(user, parse.data as any);
    return successResponse(client, 201);
  } catch (error: any) {
    console.error("[Client Create Error]:", error);
    const status = error.message.includes("already exists") ? 409 : 400;
    return errorResponse(error.message || "Failed to create client", "CLIENT_CREATE_FAILED", status);
  }
}
