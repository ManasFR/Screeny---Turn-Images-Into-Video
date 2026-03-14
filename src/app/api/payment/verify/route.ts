import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // adjust path

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { gateway } = body;

    // ─── RAZORPAY VERIFY ─────────────────────────────────────────
    if (gateway === 'razorpay') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = body;

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error('[verify] Razorpay signature mismatch');
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      // ✅ Payment verified — activate plan for user
      await activatePlan(session.user.email, planId, razorpay_payment_id, 'razorpay');

      return NextResponse.json({ success: true, message: 'Payment successful!' });
    }

    // ─── PAYPAL VERIFY ───────────────────────────────────────────
    if (gateway === 'paypal') {
      const { paypalOrderId, planId } = body;

      // Get access token
      const authRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
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

      // Capture the order (actually charge the card)
      const captureRes = await fetch(
        `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${authData.access_token}`,
          },
        }
      );
      const captureData = await captureRes.json();

      if (captureData.status !== 'COMPLETED') {
        console.error('[verify] PayPal capture failed:', captureData);
        return NextResponse.json({ error: 'PayPal payment not completed' }, { status: 400 });
      }

      const transactionId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      // ✅ Payment verified — activate plan
      await activatePlan(session.user.email, planId, transactionId, 'paypal');

      return NextResponse.json({ success: true, message: 'Payment successful!' });
    }

    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 });

  } catch (err: any) {
    console.error('[verify] Error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}

// ─── Activate plan in your DB ─────────────────────────────────────────────
// Adjust this to match your Prisma schema / DB logic
async function activatePlan(
  email: string,
  planId: number,
  transactionId: string,
  gateway: string
) {
  // Example with Prisma — replace with your actual DB calls
  // import { prisma } from '@/lib/prisma';

  // await prisma.userPlan.upsert({
  //   where:  { userEmail: email },
  //   update: { planId, transactionId, gateway, activatedAt: new Date() },
  //   create: { userEmail: email, planId, transactionId, gateway, activatedAt: new Date() },
  // });

  // Or call your existing plan activation API:
  // await fetch('/api/user/activate-plan', { method: 'POST', body: JSON.stringify({ email, planId }) });

  console.log(`[activatePlan] email=${email} planId=${planId} txn=${transactionId} via=${gateway}`);
  // TODO: wire up to your actual DB / plan activation logic
}
