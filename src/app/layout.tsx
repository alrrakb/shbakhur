import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import NextTopLoader from 'nextjs-toploader';

import { getSiteLogo } from "@/lib/database";

export async function generateMetadata(): Promise<Metadata> {
  let logoUrl = '/favicon.ico';
  try {
    const siteData = await getSiteLogo();
    if (siteData && siteData.logo_url) {
      logoUrl = siteData.logo_url;
    }
  } catch (error) {
    // ignore
  }

  return {
    title: "SH للبخور | متجر العطور والبخور الفاخرة",
    description: "متخصص في أجود أنواع البخور والعطور والعود الطبيعي والفاخر",
    icons: {
      icon: logoUrl,
      shortcut: logoUrl,
      apple: logoUrl,
      other: {
        rel: 'apple-touch-icon-precomposed',
        url: logoUrl,
      },
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col relative">
        <NextTopLoader color="#C9A227" showSpinner={false} crawl={false} height={3} shadow="0 0 10px #C9A227,0 0 5px #C9A227" />
        <div className="arabic-pattern" />
        <div className="starry-overlay" />
        <CartProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
