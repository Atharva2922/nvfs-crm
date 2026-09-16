import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuditService } from "@/services/audit.service";
import { RbacService } from "@/services/rbac.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const [roles, allPermissions] = await Promise.all([
      db.role.findMany({
        orderBy: { level: "desc" },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
          _count: {
            select: { users: true },
          },
        },
      }),
      db.permission.findMany({
        orderBy: [{ module: "asc" }, { code: "asc" }],
      }),
    ]);

    return successResponse({ roles, allPermissions });
  } catch (error) {
    console.error("[Roles GET Error]:", error);
    return errorResponse("Failed to fetch roles", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Only Super Admin can manage roles
    if (user.roleCode !== "SUPER_ADMIN") {
      return errorResponse("Forbidden: Only Super Admin can modify role permissions", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { roleId, permissionId, action } = body; // action: "assign" | "revoke"

    if (!roleId || !permissionId || !["assign", "revoke"].includes(action)) {
      return errorResponse("Invalid parameters", "INVALID_INPUT", 400);
    }

    if (action === "assign") {
      await db.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        create: { roleId, permissionId },
        update: {},
      });
    } else {
      await db.rolePermission.deleteMany({
        where: { roleId, permissionId },
      });
    }

    // Audit log
    await AuditService.logMutation({
      actorId: user.id,
      action: action === "assign" ? "ROLE_PERMISSION_ASSIGNED" : "ROLE_PERMISSION_REVOKED",
      entity: "RolePermission",
      entityId: `${roleId}_${permissionId}`,
      newValue: { roleId, permissionId, action },
      metadata: { source: "roles_api" },
    });

    return successResponse({ success: true, action });
  } catch (error) {
    console.error("[Roles POST Error]:", error);
    return errorResponse("Failed to update role permission", "INTERNAL_ERROR", 500);
  }
}
