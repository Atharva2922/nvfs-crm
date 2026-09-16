import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CategoryService } from "@/services/category.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const tree = searchParams.get("tree") === "true";

    const data = tree
      ? await CategoryService.getCategoryTree(user.employee.organizationId)
      : await CategoryService.getCategories(user.employee.organizationId, type);

    return successResponse(data);
  } catch (error: any) {
    console.error("[Categories GET Error]:", error);
    return errorResponse(error.message || "Failed to list categories", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.code || !body.name) {
      return errorResponse("Code and Name are required", "VALIDATION_ERROR", 400);
    }

    const category = await CategoryService.createCategory(user, body);
    return successResponse(category, 201);
  } catch (error: any) {
    console.error("[Categories POST Error]:", error);
    return errorResponse(error.message || "Failed to create category", "INTERNAL_ERROR", 400);
  }
}
