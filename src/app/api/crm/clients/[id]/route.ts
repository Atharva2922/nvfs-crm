import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ClientService } from "@/services/client.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const client360 = await ClientService.getClient360(id, user);
    return successResponse(client360);
  } catch (error: any) {
    console.error("[Client 360 GET Error]:", error);
    const status = error.message.includes("Access Denied") ? 403 : 404;
    return errorResponse(error.message || "Failed to retrieve client profile", "NOT_FOUND", status);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    const updated = await ClientService.updateClient(id, user, body);
    return successResponse(updated);
  } catch (error: any) {
    console.error("[Client Update Error]:", error);
    return errorResponse(error.message || "Failed to update client", "UPDATE_FAILED", 400);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    if (!ClientService.isExecutive(user)) {
      return errorResponse("Forbidden: Only executive leadership can delete client accounts", "FORBIDDEN", 403);
    }

    await db.client.delete({ where: { id } });
    return successResponse({ deleted: true, id });
  } catch (error: any) {
    console.error("[Client Delete Error]:", error);
    return errorResponse(error.message || "Failed to delete client", "DELETE_FAILED", 500);
  }
}
