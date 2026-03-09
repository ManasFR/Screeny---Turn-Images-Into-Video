'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { 
  ArrowRight, Video, Music, Download, Check, Zap, Layers, PlayCircle, 
  ChevronRight, Star, Shield, ZapIcon, Globe, Users, Code, LineChart
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';


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

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch plans (Logic unchanged)
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/plans');
        if (!response.ok) {
          throw new Error(`Failed to fetch plans: Status ${response.status}`);
        }
        const result = await response.json();
        if (result.data) {
          setPlans(result.data);
        } else {
          setError('No plans found');
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, []);

  const handleGetStarted = () => {
    router.push('/user/register');
  };

  const handleSelectPlan = () => {
    if (!session) {
      router.push('/user/login');
      return;
    }
    router.push('/plans');
  };

  return (
    <div className={`min-h-screen bg-[#030303] text-[#FAFAFA] overflow-x-hidden selection:bg-indigo-500/30 ${jakarta.className}`}>
      
      {/* Dynamic Background Ambient Glows */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none z-0 animate-pulse duration-[10000ms]"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* Floating Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`flex justify-between items-center transition-all duration-500 rounded-full px-6 py-3 ${isScrolled ? 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-transparent'}`}>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Screeny</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              {['Features', 'How it Works', 'Use Cases', 'Pricing'].map((item) => (
                <Link key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-medium text-white/60 hover:text-white transition-colors relative group">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              {!session && <button onClick={handleGetStarted} className="hidden md:block text-sm font-medium text-white/70 hover:text-white transition-colors">Log in</button>}
              <button
                onClick={handleGetStarted}
                className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {session ? 'Dashboard' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6 z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer border-indigo-500/30">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping absolute"></span>
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 relative"></span>
            <span className="text-sm font-medium text-white/90">Screeny 2.0 is now available globally</span>
            <ChevronRight className="w-4 h-4 text-white/50" />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-[1.05]">
            Cinematic Zoom Videos.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
              Made Effortless.
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Transform static images into highly engaging, dynamic zoom animations with custom audio and seamless transitions. <span className="text-white">In under 60 seconds.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-white to-gray-200 text-black px-8 py-4 rounded-full text-lg font-bold hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1"
            >
              Start Creating Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-white/5 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-full text-lg font-bold hover:bg-white/15 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1 group"
            >
              <PlayCircle className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Premium Fake UI Mockup */}
        <div className="max-w-6xl w-full mx-auto mt-24 relative group perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent z-20 top-1/2 pointer-events-none"></div>
          <div className="rounded-2xl md:rounded-[2rem] border border-white/10 bg-white/[0.02] p-2 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-transform duration-700 hover:rotate-x-2">
            <div className="rounded-xl md:rounded-[1.5rem] overflow-hidden border border-white/5 bg-[#0a0a0a] aspect-video flex items-center justify-center relative shadow-inner">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"></div>
               <div className="absolute inset-0 flex items-center justify-center z-10">
                 <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 cursor-pointer hover:scale-110 transition-all duration-300 hover:bg-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <PlayCircle className="w-10 h-10 text-white translate-x-0.5" />
                 </div>
               </div>
               
               {/* Timeline Mockup */}
               <div className="absolute bottom-6 left-6 right-6 h-16 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center px-6 gap-6 z-10 transform translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                 <div className="flex gap-3">
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors"><PlayCircle className="w-5 h-5 text-white" /></div>
                 <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group/timeline">
                    <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-white rounded-full -translate-y-1/2 -translate-x-1/2 shadow-lg opacity-0 group-hover/timeline:opacity-100 transition-opacity"></div>
                 </div>
                 <span className="text-sm text-white/70 font-mono tracking-wider">00:14 / 00:45</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-10 border-y border-white/5 bg-white/[0.01] relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-8">Trusted by innovative creators worldwide</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder icons representing brands */}
            <div className="flex items-center gap-2"><Globe className="w-6 h-6"/> <span className="text-xl font-bold">GlobalTech</span></div>
            <div className="flex items-center gap-2"><Code className="w-6 h-6"/> <span className="text-xl font-bold">DevStudio</span></div>
            <div className="flex items-center gap-2"><LineChart className="w-6 h-6"/> <span className="text-xl font-bold">Metrics</span></div>
            <div className="flex items-center gap-2"><Shield className="w-6 h-6"/> <span className="text-xl font-bold">SecureCorp</span></div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">Create magic in 3 steps.</h2>
            <p className="text-white/50 text-xl font-medium max-w-2xl mx-auto">No complex timelines. No keyframing. Just drop your content and let our engine do the heavy lifting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 -translate-y-1/2 z-0"></div>
            
            {[
              { step: '01', title: 'Upload Assets', desc: 'Drag and drop your high-res images and audio tracks into the browser.', icon: <Download className="w-8 h-8 text-indigo-400" /> },
              { step: '02', title: 'Set the Mood', desc: 'Choose your zoom style, easing curve, and focal points with a single click.', icon: <ZapIcon className="w-8 h-8 text-purple-400" /> },
              { step: '03', title: 'Export 4K', desc: 'Render your cinematic animation in blazing fast WebM or MP4 format.', icon: <Video className="w-8 h-8 text-pink-400" /> }
            ].map((item, i) => (
              <div key={i} className="relative z-10 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] group">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {item.icon}
                </div>
                <div className="text-5xl font-black text-white/5 absolute top-4 right-6 group-hover:text-white/10 transition-colors">{item.step}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-32 px-6 relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 md:flex md:justify-between md:items-end">
            <div>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                A studio in your browser.
              </h2>
              <p className="text-white/50 text-xl font-medium max-w-lg">Everything required to build viral shorts, gripping presentations, and stunning ad creatives.</p>
            </div>
            <button onClick={handleGetStarted} className="mt-8 md:mt-0 flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors group">
              View all features <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[280px]">
            {/* Large Card */}
            <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 rounded-[2rem] p-10 hover:border-indigo-500/30 transition-all duration-500 group flex flex-col justify-between overflow-hidden relative shadow-lg">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 transform origin-top-right">
                <Video className="w-64 h-64 text-indigo-400" />
              </div>
              <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#0a0a0a] to-transparent z-0"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-indigo-500/20">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-4xl font-bold mb-4 tracking-tight">Ultra-Smooth<br/>Zoom Controls</h3>
                <p className="text-white/60 text-lg max-w-md leading-relaxed">
                  Generate cinematic push-ins and pull-outs. Take complete control over timing, focal points, and easing curves without touching a single keyframe.
                </p>
              </div>
            </div>

            {/* Small Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-purple-500/30 transition-all duration-500 flex flex-col justify-between group">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Music className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Audio Sync</h3>
                <p className="text-white/50 text-base leading-relaxed">Upload your own tracks or choose from our royalty-free library to set the mood instantly.</p>
              </div>
            </div>

            {/* Small Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-pink-500/30 transition-all duration-500 flex flex-col justify-between group">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Unlimited Layers</h3>
                <p className="text-white/50 text-base leading-relaxed">Combine dozens of images seamlessly. We handle the heavy rendering in the cloud.</p>
              </div>
            </div>

            {/* Medium Horizontal Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-[2rem] p-8 hover:border-blue-500/30 transition-all duration-500 flex flex-col sm:flex-row items-start sm:items-center gap-8 group">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.4)] group-hover:rotate-12 transition-transform duration-500">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-3">Lightning Fast WebM Export</h3>
                <p className="text-white/50 text-lg leading-relaxed max-w-xl">Export natively in WebM for the highest quality with transparent backgrounds, perfectly optimized for web and social media performance.</p>
              </div>
            </div>

            {/* Small Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-green-500/30 transition-all duration-500 flex flex-col justify-between group">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Zero Watermarks</h3>
                <p className="text-white/50 text-base leading-relaxed">Keep your brand front and center. Premium exports are 100% clean and unbranded.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 flex flex-col items-center">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Simple, scalable pricing.</h2>
            <p className="text-white/50 text-xl font-medium max-w-2xl">Pay once, own it forever. No hidden fees. Cancel anytime.</p>
          </div>

          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md py-6 px-8 rounded-2xl max-w-lg mx-auto text-center flex flex-col items-center gap-4">
               <Shield className="w-8 h-8 text-red-400" />
               <p className="text-red-400 text-lg font-medium">{error}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-white/50 mt-6 font-medium text-lg animate-pulse">Fetching latest pricing...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
              {/* Note: Logic preserved perfectly, mapping only id=10 as in original */}
              {plans.filter(plan => plan.id === 10).map((plan, idx) => {
                const isPopular = idx === 0; 
                
                return (
                  <div key={plan.id} className={`relative flex flex-col rounded-[2.5rem] p-10 transition-all duration-500 hover:-translate-y-2 ${isPopular ? 'bg-gradient-to-b from-indigo-500/10 via-[#0a0a0a] to-[#0a0a0a] border-indigo-500/50 border-2 shadow-[0_0_50px_rgba(99,102,241,0.15)] transform md:scale-105 z-10' : 'bg-white/5 border border-white/10 hover:border-white/20'}`}>
                    
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
                        <span className="text-6xl font-black tracking-tighter">
                          ${plan.salePrice.toFixed(2)}
                        </span>
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

                    <div className="w-full h-px bg-white/10 mb-8"></div>

                    <div className="space-y-5 mb-12 flex-grow">
                      {plan.features && plan.features.length > 0 && (
                        <>
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-4">
                              <div className="mt-0.5 bg-indigo-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0" /></div>
                              <span className="text-base font-medium text-white/70 leading-relaxed">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <button
                    onClick={() => handleSelectPlan()}
                      className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 group ${isPopular ? 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      Choose {plan.planName}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 relative z-10 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-white/50 text-lg">Everything you need to know about Screeny.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Is this a subscription?', a: 'No, our main plans are lifetime deals. You pay once and own the software forever, including minor updates.' },
              { q: 'Do I need a powerful computer?', a: 'Not at all. Screeny is heavily optimized to run in modern browsers. The heavy lifting is done in the cloud.' },
              { q: 'Can I use this for commercial projects?', a: 'Absolutely. Videos exported on premium plans are 100% yours to use commercially without attribution.' }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                <h4 className="text-xl font-bold mb-2">{faq.q}</h4>
                <p className="text-white/60">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Epic Call to Action Section */}
      <section className="py-40 px-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-12 md:p-24 rounded-[3rem] shadow-2xl">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-tight">
            Ready to zoom in?
          </h2>
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">Join thousands of creators producing cinematic zoom animations in seconds. Start your journey today.</p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-black px-12 py-5 rounded-full text-xl font-bold hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto group"
          >
            Create Your First Video
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Expanded Footer */}
      <footer className="border-t border-white/10 py-16 z-10 relative bg-[#010101]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Screeny</span>
            </div>
            <p className="text-white/40 text-base max-w-sm mb-6 leading-relaxed">
              The ultimate browser-based animation studio. Turn any image into a breathtaking cinematic experience.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white/90">Product</h4>
            <ul className="space-y-4 text-white/50 text-sm">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white/90">Legal</h4>
            <ul className="space-y-4 text-white/50 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm font-medium">
            &copy; {new Date().getFullYear()} Screeny. Crafted for creators.
          </p>
          <div className="flex gap-4">
             {/* Social placeholders */}
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors"><Globe className="w-4 h-4 text-white/50" /></div>
          </div>
        </div>
      </footer>
    </div>
  );
}