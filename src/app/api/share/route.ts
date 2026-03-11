import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __ssShareStore: Map<string, { buffer: Buffer; createdAt: number }> | undefined;
}

if (!global.__ssShareStore) {
  global.__ssShareStore = new Map();
}

const store = global.__ssShareStore;

function cleanup() {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now - val.createdAt > 24 * 60 * 60 * 1000) store.delete(key);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = await req.json();

    if (!dataUrl || !dataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    cleanup();

    const buffer = Buffer.from(dataUrl.replace("data:image/png;base64,", ""), "base64");

    if (buffer.length > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 20MB)" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    store.set(id, { buffer, createdAt: Date.now() });

    const shareUrl = `${req.nextUrl.origin}/api/share/${id}`;
    return NextResponse.json({ id, url: shareUrl });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
