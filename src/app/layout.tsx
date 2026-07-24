import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forklane",
  description: "Open-source software discovery platform",
  metadataBase: new URL('https://forklane.dev'),
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <PostHogIdentify />
          <SiteHeader />
          <div id="main-content">
            {children}
          </div>
          <SiteFooter />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
