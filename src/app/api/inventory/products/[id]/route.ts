import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ProductService } from "@/services/product.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const product = await ProductService.getProductById(id, user);
    if (!product) return errorResponse("Product not found", "NOT_FOUND", 404);

    return successResponse(product);
  } catch (error: any) {
    console.error("[Product GET Error]:", error);
    return errorResponse(error.message || "Failed to retrieve product", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const body = await req.json();

    const product = await ProductService.updateProduct(id, user, body);
    return successResponse(product);
  } catch (error: any) {
    console.error("[Product PATCH Error]:", error);
    return errorResponse(error.message || "Failed to update product", "INTERNAL_ERROR", 400);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await context.params;
    const product = await ProductService.deleteProduct(id, user);
    return successResponse(product);
  } catch (error: any) {
    console.error("[Product DELETE Error]:", error);
    return errorResponse(error.message || "Failed to delete product", "INTERNAL_ERROR", 400);
  }
}
