'use client';

import Link from 'next/link';
import { Video, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';

const Header = () => {
  const { data: session } = useSession();

  const getFirstWord = () => {
    const raw = session?.user?.name || session?.user?.email || '';
    return raw.split(/[\s@]/)[0];
  };

  return (
    <header className="border-b border-white/[0.05] pb-5 mb-10">
      <div className="max-w-full mx-auto flex justify-between items-center">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
            Screeny
          </h1>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Plans link */}
          <Link
            href="/plans"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 group"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
            Plans
          </Link>

          {/* User pill */}
          {session?.user && (
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2 hover:bg-white/[0.07] transition-all duration-200 cursor-default">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-purple-500/40"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {getFirstWord()[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-slate-200 capitalize">
                {getFirstWord()}
              </span>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;