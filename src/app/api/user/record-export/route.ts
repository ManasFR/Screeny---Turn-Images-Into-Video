import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import crypto from "crypto";

// Define interface for raw query result
interface ExportCount {
  count: bigint;
}

const prisma = new PrismaClient();

export async function POST() {
  try {
    // ✅ Get logged-in user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    // ✅ Get user details with plan_id
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, plan_id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ If plan_id is 0, user has no plan - deny export
    if (user.plan_id === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No active plan. Please purchase a plan.",
        },
        { status: 403 }
      );
    }

    // ✅ Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: user.plan_id },
      select: {
        id: true,
        videos: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }

    // ✅ Get current month's start and end date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // ✅ Count exports this month using raw SQL (PostgreSQL syntax)
    const exportsResult: ExportCount[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "videoexports"
      WHERE "userId" = ${user.id}
      AND "exportedAt" >= ${startOfMonth}
      AND "exportedAt" <= ${endOfMonth}
    `;

    const exportsThisMonth = Number(exportsResult[0]?.count || 0);

    // ✅ Check if user has exceeded limit
    if (exportsThisMonth >= plan.videos) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Monthly export limit reached. Please upgrade your plan or wait for next month.",
        },
        { status: 403 }
      );
    }

    // ✅ Record the export in database
    const exportId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "videoexports" ("id", "userId", "planId", "exportedAt")
      VALUES (${exportId}, ${user.id}, ${user.plan_id}, NOW())
    `;

    // ✅ Return updated stats
    const newExportsCount = exportsThisMonth + 1;
    const videosRemaining = plan.videos - newExportsCount;

    return NextResponse.json({
      success: true,
      message: "Export recorded successfully",
      videosUsed: newExportsCount,
      videosLimit: plan.videos,
      videosRemaining: Math.max(0, videosRemaining),
    });
  } catch (err: unknown) {
    console.error("Record export error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
