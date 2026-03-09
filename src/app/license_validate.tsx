'use client';

import { useState, useEffect } from 'react';
import { Key, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  plan: {
    id: number;
    planName: string;
    // Add other plan fields if needed
  };
  onClose?: () => void;
}

export default function LicenseValidate({ plan, onClose }: Props) {
  const [licenseCode, setLicenseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isMounted, setIsMounted] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setStatus('idle');

    try {
      const res = await fetch('/api/license/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          licenseCode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage('License validated successfully!');
        // Small delay for the user to see success state
        setTimeout(() => {
            window.location.href = '/dashboard/duprun';
        }, 1000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Invalid license code');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 flex justify-center items-center z-[100] transition-all duration-500 ${isMounted ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}>
      
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className={`relative bg-[#0a0a0a] border border-white/10 p-1 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-md w-full mx-4 transform transition-all duration-500 ${isMounted ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}>
        
        {/* Inner Card */}
        <div className="bg-gradient-to-b from-white/5 to-transparent rounded-[2.3rem] p-8 relative overflow-hidden">
          
          {/* Ambient Modal Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none z-0"></div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
              <Key className="w-8 h-8 text-white" />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Activate {plan.planName}
              </h2>
              <p className="text-white/50 font-medium">Enter your secure license key below to unlock full access.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono uppercase tracking-widest"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || status === 'success'}
                className="relative w-full overflow-hidden bg-white text-black px-6 py-4 rounded-xl text-lg font-bold hover:bg-gray-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-center gap-2 relative z-10">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Validating...
                    </>
                  ) : status === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" /> Success! Redirecting...
                    </>
                  ) : (
                    'Validate License'
                  )}
                </div>
                {/* Button shine effect */}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
              </button>
            </form>

            {/* Status Messages */}
            {message && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
                status === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 
                'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {status === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}