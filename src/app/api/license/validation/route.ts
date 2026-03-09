import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Get logged-in user session
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" }, 
        { status: 401 }
      );
    }

    const { planId, licenseCode } = await req.json();

    if (!planId || !licenseCode) {
      return NextResponse.json(
        { success: false, message: "Missing fields" }, 
        { status: 400 }
      );
    }

    // Step 1: Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: Number(planId) },
      select: { license_id: true },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" }, 
        { status: 404 }
      );
    }

    // Step 2: Get license record
    const license = await prisma.license.findUnique({
      where: { id: plan.license_id },
      select: { licenseCodes: true, status: true },
    });

    if (!license) {
      return NextResponse.json(
        { success: false, message: "License not found" }, 
        { status: 404 }
      );
    }

    // Step 3: Parse license codes
    const codes = JSON.parse(
      typeof license.licenseCodes === "string" ? license.licenseCodes : "[]"
    );

    // Step 4: Check if provided code exists
    const isValid = codes.includes(licenseCode);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid license code" }, 
        { status: 400 }
      );
    }

    // Step 5: Update user's plan_id
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        plan_id: Number(planId),
        updatedAt: new Date()
      },
    });

    // Step 6: Success
    return NextResponse.json({ 
      success: true, 
      message: "License validated and plan activated successfully!",
      planId: updatedUser.plan_id
    });

  } catch (err) {
    console.error("License validation error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" }, 
      { status: 500 }
    );
  }
}