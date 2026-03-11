import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __ssShareStore: Map<string, { buffer: Buffer; createdAt: number }> | undefined;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!global.__ssShareStore) {
    return NextResponse.json({ error: "Share store not initialized" }, { status: 500 });
  }

  const entry = global.__ssShareStore.get(id);
  if (!entry) {
    return NextResponse.json({ error: "Screenshot not found or expired" }, { status: 404 });
  }

  return new NextResponse(entry.buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="screenshot-${id}.png"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
