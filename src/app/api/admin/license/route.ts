import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, numberOfCodes, status } = body;

    // Basic validation
    if (!name || !numberOfCodes || !status) {
      return NextResponse.json(
        { error: 'Name, number of codes, and status are required' },
        { status: 400 }
      );
    }

    // Generate random license codes
    const licenseCodes = Array.from({ length: numberOfCodes }, () => uuidv4());

    // Save to database
    const newLicense = await prisma.license.create({
      data: {
        name,
        licenseCodes: JSON.stringify(licenseCodes),
        status,
      },
    });

    return NextResponse.json(
      { message: 'Licenses generated successfully', data: newLicense },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating licenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Something went wrong', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const licenses = await prisma.license.findMany({
      select: {
        id: true,
        name: true,
        licenseCodes: true,
        status: true,
      },
    });

    // Parse JSON licenseCodes for each license
    const parsedLicenses = licenses.map((license) => ({
      ...license,
      licenseCodes: JSON.parse(license.licenseCodes as string),
    }));

    return NextResponse.json(
      { message: 'List of licenses', data: parsedLicenses },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching licenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Something went wrong', details: errorMessage },
      { status: 500 }
    );
  }
}
