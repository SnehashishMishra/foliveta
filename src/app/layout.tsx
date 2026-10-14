import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { PdfSessionProvider } from "@/features/reader/pdf-session-provider";

const siteUrl = "https://foliveta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Foliveta — Free Online PDF Flipbook Reader",
    template: "%s | Foliveta",
  },

  description:
    "Turn PDFs into an interactive reading experience with Foliveta. Enjoy realistic page-turn animations, private local reading, and a beautiful PDF flipbook on desktop, tablet, and mobile.",

  applicationName: "Foliveta",
  creator: "Foliveta",
  publisher: "Foliveta",
  category: "technology",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Foliveta",
    title: "Foliveta — Free Online PDF Flipbook Reader",
    description:
      "Read PDFs like a real book. Enjoy interactive page turns and a clean reading experience on desktop, tablet, and mobile.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Foliveta — Free Online PDF Flipbook Reader",
    description:
      "Turn PDFs into an interactive flipbook. Read privately on desktop, tablet, or mobile.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8fc",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PdfSessionProvider>
          <SiteHeader />
          {children}
        </PdfSessionProvider>
      </body>
    </html>
  );
}
