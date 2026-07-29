import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <NextIntlClientProvider messages={messages}>
        <html lang="en">
          <body className={inter.className}>
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            <PostHogIdentify />
            <SiteHeader />
            <main id="main-content" className="pt-[var(--header-height)]">
              {children}
            </main>
            <SiteFooter />
            <Analytics />
          </body>
        </html>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}
