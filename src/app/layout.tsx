import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import NextTopLoader from 'nextjs-toploader';
import { getSiteLogo } from '@/lib/database';
import { getGoogleVerificationCode } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [siteLogo, googleCode] = await Promise.all([
    getSiteLogo().catch(() => null),
    getGoogleVerificationCode().catch(() => ''),
  ]);

  const faviconUrl = siteLogo?.favicon_url || '/favicon.png';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shbakhur.com';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "SH للبخور | متجر العطور والبخور الفاخرة",
      template: "%s | SH للبخور",
    },
    description: "متخصص في أجود أنواع البخور والعطور والعود الطبيعي والفاخر",
    verification: googleCode
      ? {
          google: googleCode,
        }
      : undefined,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
      other: {
        rel: 'apple-touch-icon-precomposed',
        url: faviconUrl,
      },
    },
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
