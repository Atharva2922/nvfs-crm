import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ProductService } from "@/services/product.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const productType = searchParams.get("productType") || undefined;
    const status = searchParams.get("status") || undefined;
    const stockStatus = (searchParams.get("stockStatus") as any) || undefined;

    const data = await ProductService.getProducts(user, {
      search,
      categoryId,
      productType,
      status,
      stockStatus,
    });

    return successResponse(data);
  } catch (error: any) {
    console.error("[Products GET Error]:", error);
    return errorResponse(error.message || "Failed to list products", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.employee) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (!body.sku || !body.name) {
      return errorResponse("SKU and Name are required fields", "VALIDATION_ERROR", 400);
    }

    const product = await ProductService.createProduct(user, body);
    return successResponse(product, 201);
  } catch (error: any) {
    console.error("[Products POST Error]:", error);
    return errorResponse(error.message || "Failed to create product", "INTERNAL_ERROR", 400);
  }
}
