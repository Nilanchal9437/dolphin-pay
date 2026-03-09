import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dolphin Pay (D pay) — A New Way to Manage Your Digital Lifestyle",
  description:
    "Seamlessly control your finances and experiences with Dolphin Pay — a secure, elegant digital platform designed for your modern life.",
  keywords: [
    "dolphin pay",
    "dpay",
    "digital payments",
    "fintech",
    "digital wallet",
  ],
  authors: [{ name: "Dolphin Pay" }],
  openGraph: {
    title: "Dolphin Pay — A New Way to Manage Your Digital Lifestyle",
    description:
      "Seamlessly control your finances and experiences with a secure, elegant digital platform designed for your modern life.",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
