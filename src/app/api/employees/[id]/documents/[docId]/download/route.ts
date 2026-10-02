import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, docId } = await params;

    const doc = await db.employeeDocument.findUnique({
      where: { id: docId, employeeId: id },
    });

    if (!doc) {
      return new NextResponse("Document not found", { status: 404 });
    }

    if (doc.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", doc.fileUrl);
      try {
        const fileBuffer = await fs.readFile(filePath);
        const mimeType = doc.mimeType || "application/octet-stream";
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
            "Content-Length": fileBuffer.length.toString(),
            "Cache-Control": "public, max-age=3600",
          },
        });
      } catch (err) {
        return new NextResponse("Document file not found on disk", { status: 404 });
      }
    }

    // If external URL, redirect to it
    return NextResponse.redirect(doc.fileUrl);
  } catch (error) {
    console.error("[Document Download GET Error]:", error);
    return new NextResponse("Failed to download document", { status: 500 });
  }
}
