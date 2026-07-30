import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/src/components/Footer";
import Script from "next/script";
import { Exo } from "next/font/google";

const exo = Exo({
  subsets: ["latin"],
  weight: ["400", "700"],
});
export const metadata: Metadata = {
  title: "Dolphin Telecoms | Connectivity for Every Part of Your Life",
  description:
    "Reliable internet and mobile services for home, business, and life on the move. Fibre, LTE, FWA, and mobile plans across Zimbabwe and South Africa.",
  keywords: [
    "dolphin telecoms",
    "fibre internet zimbabwe",
    "LTE internet zimbabwe",
    "home internet zimbabwe",
    "business internet zimbabwe",
    "mobile plans zimbabwe",
    "broadband zimbabwe",
  ],
  authors: [{ name: "Dolphin Telecoms" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
  openGraph: {
    title: "Dolphin Telecoms | Connectivity for Every Part of Your Life",
    description:
      "Reliable internet and mobile services for home, business, and life on the move. Fibre, LTE, FWA, and mobile plans across Zimbabwe and South Africa.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${exo.className}`}>
        {children}
        <Footer />
        <Script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&loading=async&libraries=places`}
        ></Script>
        {/* Zendesk Widget */}
        <Script
          id="ze-snippet"
          src="https://static.zdassets.com/ekr/snippet.js?key=253ea4cc-71ef-4038-896a-1bc27d12907b"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
