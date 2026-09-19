import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CrmProposalService } from "@/services/crm-proposal.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const proposalItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  lineTotal: z.number().optional(),
});

const createProposalSchema = z.object({
  title: z.string().min(2, "Title is required"),
  opportunityId: z.string().optional(),
  contactId: z.string().optional(),
  items: z.array(proposalItemSchema).min(1, "At least one line item is required"),
  validityDate: z.string().optional(),
  validUntil: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"]).optional(),
});

const updateStatusSchema = z.object({
  activityId: z.string().min(1),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"]),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const proposals = await CrmProposalService.getProposals(user, { clientId: id });
    return successResponse(proposals);
  } catch (error: any) {
    console.error("[Client Proposals GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve proposals", "INTERNAL_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = createProposalSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const proposal = await CrmProposalService.createProposal(user, {
      clientId: id,
      ...parse.data,
      items: parse.data.items.map((it) => ({
        ...it,
        lineTotal: it.lineTotal ?? it.quantity * it.unitPrice,
      })),
    });

    return successResponse(proposal, 201);
  } catch (error: any) {
    console.error("[Client Proposal Create Error]:", error);
    return errorResponse(error.message || "Failed to create proposal", "PROPOSAL_CREATE_FAILED", 400);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const parse = updateStatusSchema.safeParse(body);
    if (!parse.success) {
      return errorResponse(parse.error.issues[0].message, "VALIDATION_ERROR", 400);
    }

    const updated = await CrmProposalService.updateProposalStatus(
      parse.data.activityId,
      user,
      parse.data.status,
      parse.data.notes
    );

    return successResponse(updated);
  } catch (error: any) {
    console.error("[Client Proposal Update Error]:", error);
    return errorResponse(error.message || "Failed to update proposal", "UPDATE_FAILED", 400);
  }
}
