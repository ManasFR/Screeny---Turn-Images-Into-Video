import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define the expected shape of the request body
interface PlanRequestBody {
  planName: string;
  license_id: string | number;
  retailPrice: string | number;
  salePrice: string | number;
  features?: string[];
  videos?: string | number;
  watermark?: string | number;
  noWatermark?: string | number;
}

export async function POST(request: Request) {
  // Initialize body to avoid TS2454
  let body: PlanRequestBody = {} as PlanRequestBody;
  try {
    body = await request.json();
    const { planName, license_id, retailPrice, salePrice, features, videos, watermark, noWatermark } = body;

    console.log('Received data:', { planName, license_id, retailPrice, salePrice, features, videos, watermark, noWatermark });

    if (!planName || license_id === undefined || retailPrice === undefined || salePrice === undefined) {
      return NextResponse.json(
        { error: 'Required fields missing', details: { planName, license_id, retailPrice, salePrice } },
        { status: 400 }
      );
    }

    const parsedlicense_id = parseInt(String(license_id));
    const parsedRetailPrice = parseFloat(String(retailPrice));
    const parsedSalePrice = parseFloat(String(salePrice));
    const parsedVideos = videos !== undefined ? parseInt(String(videos)) : 0;
    const parsedWatermark = watermark !== undefined ? parseInt(String(watermark)) : 0;
    const parsedNoWatermark = noWatermark !== undefined ? parseInt(String(noWatermark)) : 0;

    if (isNaN(parsedlicense_id) || !Number.isInteger(parsedlicense_id)) {
      return NextResponse.json({ error: 'License ID must be an integer' }, { status: 400 });
    }
    if (isNaN(parsedRetailPrice) || isNaN(parsedSalePrice)) {
      return NextResponse.json({ error: 'Prices must be numbers' }, { status: 400 });
    }
    if (isNaN(parsedVideos) || parsedVideos < 0) {
      return NextResponse.json({ error: 'Videos must be a positive number' }, { status: 400 });
    }
    if (![0, 1].includes(parsedWatermark) || ![0, 1].includes(parsedNoWatermark)) {
      return NextResponse.json({ error: 'Watermark fields must be 0 or 1' }, { status: 400 });
    }

    const existingLicense = await prisma.license.findUnique({ where: { id: parsedlicense_id } });
    if (!existingLicense) return NextResponse.json({ error: 'Invalid license ID' }, { status: 400 });

    let parsedFeatures: string[] = [];
    if (features) {
      if (!Array.isArray(features)) {
        return NextResponse.json({ error: 'Features must be an array' }, { status: 400 });
      }
      parsedFeatures = features.map(f => String(f).trim()).filter(f => f.length > 0);
    }

    const newPlan = await prisma.plan.create({
      data: {
        planName,
        license_id: parsedlicense_id,
        retailPrice: parsedRetailPrice,
        salePrice: parsedSalePrice,
        videos: parsedVideos,
        watermark: parsedWatermark,
        noWatermark: parsedNoWatermark,
        features: parsedFeatures.length ? parsedFeatures : [],
      } as Prisma.planUncheckedCreateInput,
    });

    return NextResponse.json({ message: 'Plan created', data: newPlan }, { status: 201 });
  } catch (error: unknown) {
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST error:', error, 'body:', body || 'No body available');
    return NextResponse.json({ error: 'Failed to create plan', details: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        planName: true,
        license_id: true,
        retailPrice: true,
        salePrice: true,
        videos: true,
        watermark: true,
        noWatermark: true,
        features: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json(
      { message: 'List of plans', data: plans },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching plans:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch plans', details: errorMessage },
      { status: 500 }
    );
  }
}