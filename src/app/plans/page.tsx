'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, Check, Star, Shield, Video, ChevronLeft } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import LicenseValidate from '../license_validate';

const PlansHeader = () => {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between mb-16 pt-2">
      {/* Logo — clicks to /dashboard/duprun */}
      <button
        onClick={() => router.push('/dashboard/duprun')}
        className="inline-flex items-center gap-3 group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Video className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
          Screeny
        </h1>
      </button>

      {/* Back button */}
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

export default function PlansPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/admin/plans');
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const result = await res.json();
        if (result.data) {
          setPlans(result.data);
        } else {
          setError('No plans found');
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load plans. Please try again.');
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (!session) {
      router.push('/user/register');
      return;
    }
    setSelectedPlan(plan);
    setShowModal(true);
  };

  return (
    <div className={`min-h-screen bg-[#030303] text-[#FAFAFA] overflow-x-hidden selection:bg-indigo-500/30 ${jakarta.className}`}>

      {/* Ambient glows */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none z-0 animate-pulse duration-[10000ms]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* Header — has logo + user pill + back to dashboard */}
        <PlansHeader />

        {/* Page heading */}
        <div className="text-center mb-24 flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Simple, scalable pricing.
          </h1>
          <p className="text-white/50 text-xl font-medium max-w-2xl">
            Pay once, own it forever. No hidden fees. No subscriptions.
          </p>
        </div>

        {/* Plans grid */}
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md py-6 px-8 rounded-2xl max-w-lg mx-auto text-center flex flex-col items-center gap-4">
            <Shield className="w-8 h-8 text-red-400" />
            <p className="text-red-400 text-lg font-medium">{error}</p>
          </div>

        ) : plans.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-white/50 mt-6 font-medium text-lg animate-pulse">
              Fetching latest pricing...
            </p>
          </div>

        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {plans.filter(plan => plan.id === 10).map((plan, idx) => {
              const isPopular = idx === 0;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[2.5rem] p-10 transition-all duration-500 hover:-translate-y-2 ${
                    isPopular
                      ? 'bg-gradient-to-b from-indigo-500/10 via-[#0a0a0a] to-[#0a0a0a] border-indigo-500/50 border-2 shadow-[0_0_50px_rgba(99,102,241,0.15)] transform md:scale-105 z-10'
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

                  {/* Plan name + price */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 text-white/90">{plan.planName}</h3>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-6xl font-black tracking-tighter">
                        ${plan.salePrice.toFixed(2)}
                      </span>
                      <span className="text-white/40 mb-2 font-medium">/ lifetime</span>
                    </div>
                    {plan.retailPrice !== plan.salePrice && (
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 line-through text-lg">
                          ${plan.retailPrice.toFixed(2)}
                        </span>
                        <span className="text-indigo-400 text-sm font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                          Save ${(plan.retailPrice - plan.salePrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="w-full h-px bg-white/10 mb-8" />

                  {/* Features */}
                  <div className="space-y-5 mb-12 flex-grow">
                    {plan.features?.map((feature, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="mt-0.5 bg-indigo-500/20 p-1 rounded-full">
                          <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        </div>
                        <span className="text-base font-medium text-white/70 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 group ${
                      isPopular
                        ? 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Choose {plan.planName}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-white/30 text-sm mt-16">
          Questions?{' '}
          <a href="mailto:support@screeny.app" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Contact support
          </a>
        </p>
      </div>

      {/* License modal */}
      {showModal && selectedPlan && (
        <LicenseValidate plan={selectedPlan} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}