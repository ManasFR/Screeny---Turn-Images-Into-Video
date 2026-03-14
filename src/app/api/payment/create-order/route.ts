import { NextRequest, NextResponse } from 'next/server';

// npm install razorpay
// npm install @paypal/paypal-server-sdk   OR use fetch for PayPal REST API

export async function POST(req: NextRequest) {
  try {
    const { gateway, planId, amount, currency = 'INR', planName } = await req.json();

    if (!gateway || !planId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ─── RAZORPAY ────────────────────────────────────────────────
    if (gateway === 'razorpay') {
      const Razorpay = (await import('razorpay')).default;

      const razorpay = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const order = await razorpay.orders.create({
        amount:   Math.round(amount * 100), // paise
        currency: currency,                 // INR, USD etc
        receipt:  `plan_${planId}_${Date.now()}`,
        notes: {
          planId:   String(planId),
          planName: planName,
        },
      });

      return NextResponse.json({
        gateway:  'razorpay',
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId:    process.env.RAZORPAY_KEY_ID,
      });
    }

    // ─── PAYPAL ──────────────────────────────────────────────────
    if (gateway === 'paypal') {
      // Get PayPal access token
      const authRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        // For sandbox: 'https://api-m.sandbox.paypal.com/v1/oauth2/token'
        method: 'POST',
        headers: {
          'Content-Type':  'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString('base64'),
        },
        body: 'grant_type=client_credentials',
      });

      const authData = await authRes.json();
      if (!authData.access_token) {
        throw new Error('PayPal auth failed');
      }

      // Create PayPal order
      const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
        // Sandbox: 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',   // PayPal generally USD
              value: amount.toFixed(2),
            },
            description: planName,
            custom_id:   String(planId),
          }],
          application_context: {
            brand_name:          'Screeny',
            landing_page:        'NO_PREFERENCE',
            user_action:         'PAY_NOW',
            return_url:          `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/plans?status=success`,
            cancel_url:          `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/plans?status=cancel`,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (orderData.id) {
        return NextResponse.json({
          gateway:  'paypal',
          orderId:  orderData.id,
          // Approval link for redirect if needed
          approveUrl: orderData.links?.find((l: any) => l.rel === 'approve')?.href,
        });
      }

      throw new Error(`PayPal order creation failed: ${JSON.stringify(orderData)}`);
    }

    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 });

  } catch (err: any) {
    console.error('[create-order] Error:', err);
    return NextResponse.json({ error: err.message || 'Order creation failed' }, { status: 500 });
  }
}
