import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE_NAME, invalidateUserSessionCache } from "@/lib/auth";
import { AuditService } from "@/services/audit.service";
import { successResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (user) {
    invalidateUserSessionCache(user.id);
    await AuditService.logMutation({
      actorId: user.id,
      action: "AUTH_LOGOUT",
      entity: "User",
      entityId: user.id,
      metadata: { source: "logout_route" },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Browser",
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return successResponse({ loggedOut: true });
}
