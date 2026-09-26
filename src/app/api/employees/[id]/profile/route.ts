import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { EmployeeOnboardingService } from "@/services/employee-onboarding.service";
import { RbacService } from "@/services/rbac.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;

    // Check permission to access this employee profile
    const allowed = await RbacService.canAccessEmployee(user, id);
    if (!allowed && user.employee?.id !== id) {
      return errorResponse("Forbidden: You do not have permission to view this profile", "FORBIDDEN", 403);
    }

    const dossier = await EmployeeOnboardingService.getEmployeeDossier(id);
    if (!dossier) {
      return errorResponse("Employee dossier not found", "NOT_FOUND", 404);
    }

    return successResponse(dossier);
  } catch (error: any) {
    console.error("[Employee Profile GET Error]:", error);
    return errorResponse(error.message || "Failed to load employee profile", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;

    // Self-edit is allowed for own profile completion, or HR / Admin
    const isSelf = user.employee?.id === id;
    const isHrOrAdmin = ["SUPER_ADMIN", "ADMIN", "CEO", "HR"].includes(user.roleCode);
    const hasPermission = await RbacService.hasPermission(user.id, "employees.employee.update");

    if (!isSelf && !isHrOrAdmin && !hasPermission) {
      return errorResponse("Forbidden: You cannot modify this employee profile", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const updatedDossier = await EmployeeOnboardingService.updateEmployeeProfile(id, body, user.id);

    return successResponse(updatedDossier);
  } catch (error: any) {
    console.error("[Employee Profile PUT Error]:", error);
    return errorResponse(error.message || "Failed to update profile", "INTERNAL_ERROR", 500);
  }
}
