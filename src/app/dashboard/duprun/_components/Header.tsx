'use client';

import Link from 'next/link';

const Header = () => {
  return (
    <header className="border-b border-gray-800 pb-6 mb-10">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div className="text-3xl font-extrabold tracking-tight">
          <Link href="/" className="cursor-pointer">
            🌙 DUPRUN
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
