'use client';

import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Plus_Jakarta_Sans } from 'next/font/google';

import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body style={{ fontFamily: "'Plus Jakarta Sans', 'Poppins', sans-serif" }}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}