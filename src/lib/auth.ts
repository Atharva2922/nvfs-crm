import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { AuthenticatedUser, SystemRoleCode } from "@/types";

export const SESSION_COOKIE_NAME = "nfvs_session";
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: string;
  email: string;
  roleCode: SystemRoleCode;
  expiresAt: number;
}

export function createSessionToken(user: { id: string; email: string; roleCode: SystemRoleCode }): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    roleCode: user.roleCode,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function parseSessionToken(token: string): SessionPayload | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.userId || !payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

import { cache } from "react";

// In-memory session cache for rapid concurrent requests across API routes
interface CachedUserSession {
  user: AuthenticatedUser;
  cachedAt: number;
}

const userSessionMemoryCache = new Map<string, CachedUserSession>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function invalidateUserSessionCache(userId?: string) {
  if (userId) {
    userSessionMemoryCache.delete(userId);
  } else {
    userSessionMemoryCache.clear();
  }
}

export const getCurrentUser = cache(async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = parseSessionToken(token);
    if (!payload) return null;

    // Check in-memory cache first to avoid repetitive remote DB roundtrips
    const cached = userSessionMemoryCache.get(payload.userId);
    const now = Date.now();
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      return cached.user;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        employee: {
          include: {
            department: true,
            organization: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      userSessionMemoryCache.delete(payload.userId);
      return null;
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      roleCode: user.role.code as SystemRoleCode,
      roleName: user.role.name,
      roleLevel: user.role.level,
      isActive: user.isActive,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeNumber: user.employee.employeeNumber,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            designation: user.employee.designation,
            departmentName: user.employee.department?.name || null,
            departmentId: user.employee.departmentId,
            organizationName: user.employee.organization.name,
            organizationId: user.employee.organization.id,
            managerId: user.employee.managerId,
            workMode: user.employee.workMode,
            location: user.employee.location,
            employmentType: user.employee.employmentType,
          }
        : null,
      permissions: user.role.rolePermissions.map((rp) => rp.permission.code),
    };

    userSessionMemoryCache.set(payload.userId, {
      user: authenticatedUser,
      cachedAt: now,
    });

    return authenticatedUser;
  } catch (error) {
    console.error("[Auth Error]: Failed to retrieve current user", error);
    return null;
  }
});

