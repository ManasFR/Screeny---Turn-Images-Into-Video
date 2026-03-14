'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowRight, Check, Star, Shield, Video, ChevronLeft,
  X, CreditCard, Ticket, Loader2, CheckCircle, AlertCircle,
} from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import LicenseValidate from '../license_validate';

// ─── Razorpay types ──────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
    paypal: any;
  }
}

// ─── Load external script once ──────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ─── Header ─────────────────────────────────────────────────────────────────
const PlansHeader = () => {
  const router = useRouter();
  return (
    <header className="flex items-center justify-between mb-16 pt-2">
      <button onClick={() => router.push('/dashboard/duprun')} className="inline-flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Video className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
          Screeny
        </h1>
      </button>
      <button
        onClick={() => router.push('/dashboard/duprun')}
        className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 group border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06]"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </button>
    </header>
  );
};

// ─── Payment Modal ───────────────────────────────────────────────────────────
type ModalStep = 'choose' | 'license' | 'success' | 'error';

interface PaymentModalProps {
  plan: Plan;
  onClose: () => void;
  userEmail: string;
  userName: string;
}

const PaymentModal = ({ plan, onClose, userEmail, userName }: PaymentModalProps) => {
  const [step,          setStep]          = useState<ModalStep>('choose');
  const [loading,       setLoading]       = useState<'razorpay' | 'paypal' | null>(null);
  const [errorMsg,      setErrorMsg]      = useState('');
  const [paypalRendered, setPaypalRendered] = useState(false);

  // ── Razorpay ──────────────────────────────────────────────────────
  const handleRazorpay = useCallback(async () => {
    setLoading('razorpay');
    setErrorMsg('');
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');

      // 1. Create order on server
      const res = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway:  'razorpay',
          planId:   plan.id,
          amount:   plan.salePrice,
          currency: 'INR',          // change to your currency
          planName: plan.planName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order creation failed');

      setLoading(null);

      // 2. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:          data.keyId,
        amount:       data.amount,
        currency:     data.currency,
        name:         'Screeny',
        description:  plan.planName,
        order_id:     data.orderId,
        prefill: {
          email: userEmail,
          name:  userName,
        },
        theme: { color: '#6366f1' },

        handler: async (response: any) => {
          // 3. Verify on server
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gateway:             'razorpay',
                planId:              plan.id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });
            const vData = await verifyRes.json();
            if (verifyRes.ok && vData.success) {
              setStep('success');
            } else {
              throw new Error(vData.error || 'Verification failed');
            }
          } catch (err: any) {
            setErrorMsg(err.message);
            setStep('error');
          }
        },

        modal: {
          ondismiss: () => setLoading(null),
        },
      });

      rzp.open();

    } catch (err: any) {
      setLoading(null);
      setErrorMsg(err.message || 'Razorpay failed to load');
      setStep('error');
    }
  }, [plan, userEmail, userName]);

  // ── PayPal ────────────────────────────────────────────────────────
  const handlePayPal = useCallback(async () => {
    if (paypalRendered) return; // already rendered
    setLoading('paypal');
    setErrorMsg('');
    try {
      // Load PayPal JS SDK with your client ID
      await loadScript(
        `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`
      );

      setLoading(null);
      setPaypalRendered(true);

      // Render PayPal buttons into the container
      setTimeout(() => {
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color:  'blue',
            shape:  'rect',
            label:  'pay',
          },

          // 1. Create order on server
          createOrder: async () => {
            const res = await fetch('/api/payment/create-order', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gateway:  'paypal',
                planId:   plan.id,
                amount:   plan.salePrice,
                currency: 'USD',
                planName: plan.planName,
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.orderId; // PayPal uses orderId
          },

          // 2. On approval — verify + capture on server
          onApprove: async (data: any) => {
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gateway:      'paypal',
                  planId:       plan.id,
                  paypalOrderId: data.orderID,
                }),
              });
              const vData = await verifyRes.json();
              if (verifyRes.ok && vData.success) {
                setStep('success');
              } else {
                throw new Error(vData.error || 'Verification failed');
              }
            } catch (err: any) {
              setErrorMsg(err.message);
              setStep('error');
            }
          },

          onError: (err: any) => {
            setErrorMsg('PayPal encountered an error. Please try again.');
            setStep('error');
          },

          onCancel: () => {
            setPaypalRendered(false);
          },
        }).render('#paypal-button-container');
      }, 100);

    } catch (err: any) {
      setLoading(null);
      setErrorMsg(err.message || 'PayPal failed to load');
      setStep('error');
    }
  }, [plan, paypalRendered]);

  // ── If license step → existing component ──────────────────────────
  if (step === 'license') {
    return <LicenseValidate plan={plan} onClose={onClose} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '480px', borderRadius: '28px',
        background: 'linear-gradient(160deg, #0e0e12 0%, #09090d 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15)',
        padding: '32px', position: 'relative',
        animation: 'modalIn 0.22s cubic-bezier(.34,1.56,.64,1)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Close */}
        {step !== 'success' && (
          <button onClick={onClose} style={{
            position: 'absolute', top: '18px', right: '18px',
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
          }}>
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle style={{ width: '36px', height: '36px', color: '#22c55e' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>Payment Successful!</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>
              Welcome to <strong style={{ color: '#fff' }}>{plan.planName}</strong>. Your account has been upgraded.
            </p>
            <button
              onClick={() => { onClose(); window.location.reload(); }}
              style={{ padding: '13px 32px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Start Using Screeny →
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle style={{ width: '30px', height: '30px', color: '#ef4444' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Payment Failed</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>{errorMsg}</p>
            <button onClick={() => setStep('choose')} style={{ padding: '11px 28px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {/* ── CHOOSE GATEWAY ── */}
        {step === 'choose' && (
          <>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: '12px' }}>
                <CreditCard style={{ width: '11px', height: '11px', color: '#818cf8' }} />
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#818cf8' }}>{plan.planName}</span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '5px' }}>Complete your purchase</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                One-time payment · <span style={{ color: 'rgba(165,180,252,0.9)', fontWeight: 700 }}>${plan.salePrice.toFixed(2)}</span> · Lifetime access
              </p>
            </div>

            {/* Razorpay */}
            <button
              onClick={handleRazorpay}
              disabled={!!loading}
              style={{
                width: '100%', padding: '16px 20px', borderRadius: '16px', cursor: loading ? 'wait' : 'pointer',
                background: 'rgba(43,108,176,0.1)', border: '1.5px solid rgba(43,108,176,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '10px', transition: 'all 0.18s',
                opacity: loading === 'paypal' ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'rgba(43,108,176,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(43,108,176,0.7)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(43,108,176,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(43,108,176,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#072654', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {/* Razorpay logo */}
                  <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                    <path d="M14 34L20 10H34L28 22H38L18 46L22 34H14Z" fill="#2B9FFF"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Pay with Razorpay</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>UPI · Cards · Net Banking · Wallets</p>
                </div>
              </div>
              {loading === 'razorpay'
                ? <Loader2 style={{ width: '18px', height: '18px', color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                : <ArrowRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.35)' }} />
              }
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* PayPal button + rendered buttons */}
            {!paypalRendered ? (
              <button
                onClick={handlePayPal}
                disabled={!!loading}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: '16px', cursor: loading ? 'wait' : 'pointer',
                  background: 'rgba(0,112,186,0.1)', border: '1.5px solid rgba(0,112,186,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.18s', opacity: loading === 'razorpay' ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'rgba(0,112,186,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,112,186,0.7)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,112,186,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,112,186,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.291-.077.443-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.1z" fill="#009cde"/>
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Pay with PayPal</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Cards · PayPal Balance · Bank</p>
                  </div>
                </div>
                {loading === 'paypal'
                  ? <Loader2 style={{ width: '18px', height: '18px', color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                  : <ArrowRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.35)' }} />
                }
              </button>
            ) : (
              /* PayPal SDK renders its own buttons here */
              <div id="paypal-button-container" style={{ borderRadius: '16px', overflow: 'hidden', minHeight: '50px' }} />
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Already purchased?</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* License key option */}
            <button
              onClick={() => setStep('license')}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: '14px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.15s', color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 600,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
            >
              <Ticket style={{ width: '14px', height: '14px' }} />
              Enter license key
            </button>

            {/* Trust row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', marginTop: '18px' }}>
              {['Secure SSL', 'No Subscription', 'Lifetime Access'].map(badge => (
                <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield style={{ width: '10px', height: '10px', color: 'rgba(99,102,241,0.55)' }} />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>{badge}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <style>{`
          @keyframes modalIn { from{opacity:0;transform:scale(.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
      </div>
    </div>
  );
};

// ─── Font ────────────────────────────────────────────────────────────────────
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

interface Plan {
  id: number;
  planName: string;
  license_id: number;
  retailPrice: number;
  salePrice: number;
  features: string[];
  noWatermark: number;
  videos: number;
  watermark: number;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PlansPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [plans,        setPlans]        = useState<Plan[]>([]);
  const [error,        setError]        = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal,    setShowModal]    = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/admin/plans');
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const result = await res.json();
        if (result.data) setPlans(result.data);
        else setError('No plans found');
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load plans. Please try again.');
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (!session) { router.push('/user/register'); return; }
    setSelectedPlan(plan);
    setShowModal(true);
  };

  // popular = most expensive plan
  const maxPrice = Math.max(...plans.map(p => p.salePrice));

  return (
    <div className={`min-h-screen bg-[#030303] text-[#FAFAFA] overflow-x-hidden selection:bg-indigo-500/30 ${jakarta.className}`}>

      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <PlansHeader />

        <div className="text-center mb-24 flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Simple, scalable pricing.
          </h1>
          <p className="text-white/50 text-xl font-medium max-w-2xl">
            Pay once, own it forever. No hidden fees. No subscriptions.
          </p>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 py-6 px-8 rounded-2xl max-w-lg mx-auto text-center flex flex-col items-center gap-4">
            <Shield className="w-8 h-8 text-red-400" />
            <p className="text-red-400 text-lg font-medium">{error}</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-white/50 mt-6 font-medium text-lg animate-pulse">Fetching latest pricing...</p>
          </div>
        ) : (
          /* All plans — dynamic, no hardcoded filter */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {plans.map((plan) => {
              const isPopular = plan.salePrice === maxPrice;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[2.5rem] p-10 transition-all duration-500 hover:-translate-y-2 ${
                    isPopular
                      ? 'bg-gradient-to-b from-indigo-500/10 via-[#0a0a0a] to-[#0a0a0a] border-indigo-500/50 border-2 shadow-[0_0_50px_rgba(99,102,241,0.15)] md:scale-105 z-10'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg flex items-center gap-2">
                        <Star className="w-3 h-3 fill-white" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 text-white/90">{plan.planName}</h3>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-6xl font-black tracking-tighter">${plan.salePrice.toFixed(2)}</span>
                      <span className="text-white/40 mb-2 font-medium">/ lifetime</span>
                    </div>
                    {plan.retailPrice !== plan.salePrice && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 line-through text-lg">${plan.retailPrice.toFixed(2)}</span>
                        <span className="text-indigo-400 text-sm font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                          Save ${(plan.retailPrice - plan.salePrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="w-full h-px bg-white/10 mb-8" />

                  <div className="space-y-5 mb-12 flex-grow">
                    {plan.features?.map((feature, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="mt-0.5 bg-indigo-500/20 p-1 rounded-full">
                          <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        </div>
                        <span className="text-base font-medium text-white/70 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 group ${
                      isPopular
                        ? 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Buy Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-white/30 text-sm mt-16">
          Questions?{' '}
          <a href="mailto:support@screeny.app" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Contact support
          </a>
        </p>
      </div>

      {showModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowModal(false)}
          userEmail={session?.user?.email || ''}
          userName={session?.user?.name || ''}
        />
      )}
    </div>
  );
}
