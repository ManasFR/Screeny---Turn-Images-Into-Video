import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // jo tu pehle use kar rha tha

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const admin = await prisma.admins.findFirst({
      where: {
        email: email,
        password: password, // plain text hai to same
      },
    });

    if (!admin) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Login success
    return NextResponse.json({ 
      message: "Admin login successful!", 
      redirect: "/admin/dashboard" 
    });

  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}