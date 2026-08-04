import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Não autenticado", { status: 401 });
  }


  const { path } = await params;
  const filePath = join(process.cwd(), "uploads", ...path);

  if (!existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);

    const ext = path[path.length - 1]?.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      bmp: "image/bmp",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Error reading file", { status: 500 });
  }
}

