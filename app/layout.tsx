import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClaritySnippet from "@/components/clarity-snippet";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SiteCheck — Free Site Audit Tool",
  description: "Free instant audit — speed, SEO, and mobile performance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-15S3MXX26F"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-15S3MXX26F');
          `}
        </Script>
        <ClaritySnippet />
        {children}
      </body>
    </html>
  );
}
