import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeaveService } from "@/services/leave.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;
    const cancelledRequest = await LeaveService.cancelLeaveRequest(id, user.employee.id);

    return successResponse(cancelledRequest);
  } catch (error: any) {
    console.error("[Leave Cancel Error]:", error);
    return errorResponse(error.message || "Failed to cancel leave request", "BAD_REQUEST", 400);
  }
}
