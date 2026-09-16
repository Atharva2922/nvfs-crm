import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/services/auth.service";
import { AuditService } from "@/services/audit.service";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return errorResponse("Valid Google / Gmail email is required", "VALIDATION_ERROR", 400);
    }

    const user = await AuthService.loginWithGoogle(email, name, avatarUrl);
    if (!user) {
      return errorResponse("Google authorization failed or account deactivated", "UNAUTHORIZED", 401);
    }

    // Create session token
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      roleCode: user.roleCode,
    });

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Audit log
    await AuditService.logMutation({
      actorId: user.id,
      action: "AUTH_GOOGLE_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      newValue: { email: user.email, role: user.roleCode, method: "GOOGLE_SSO" },
      metadata: { source: "google_auth_route" },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Browser",
    });

    return successResponse(user);
  } catch (error) {
    console.error("[Google Auth Error]:", error);
    return errorResponse(
      "Google authentication failed. Please try again.",
      "INTERNAL_ERROR",
      500
    );
  }
}

export async function GET(req: NextRequest) {
  // If GOOGLE_CLIENT_ID is configured, redirect to Google OAuth 2.0 flow
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Return config status so client knows whether full OAuth or Direct SSO is active
    return NextResponse.json({
      oauthConfigured: false,
      message: "Direct Gmail login active. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env for external redirect.",
    });
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
