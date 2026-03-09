import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface ExportCount {
  count: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, plan_id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.plan_id === 0) {
      return NextResponse.json({
        success: false,
        message: "No active plan",
        hasAccess: false,
        videosUsed: 0,
        videosLimit: 0,
        videosRemaining: 0,
        watermark: true,
      });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: user.plan_id },
      select: { id: true, planName: true, videos: true, watermark: true, noWatermark: true },
    });

    if (!plan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const exportsResult: ExportCount[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM videoexports 
      WHERE "userId" = ${user.id}
      AND "exportedAt" >= ${startOfMonth}
      AND "exportedAt" <= ${endOfMonth}
    `;

    const exportsThisMonth = Number(exportsResult[0]?.count ?? 0);
    const videosRemaining = plan.videos - exportsThisMonth;
    const hasAccess = exportsThisMonth < plan.videos;

    return NextResponse.json({
      success: true,
      hasAccess,
      videosUsed: exportsThisMonth,
      videosLimit: plan.videos,
      videosRemaining: Math.max(0, videosRemaining),
      watermark: plan.watermark === 1,
      noWatermark: plan.noWatermark === 1,
      planName: plan.planName,
    });
  } catch (err) {
    console.error("Check export limit error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
