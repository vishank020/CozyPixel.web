import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { themeScript } from "@/lib/theme-dom";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const description =
  "Free cozy wallpapers in Catppuccin, Nord and One Dark themes. Open source & free forever.";

export const metadata: Metadata = {
  // Relative URLs below (og images, canonical) resolve against the deployed site
  metadataBase: new URL(`${SITE_URL}/`),
  title: "CozyPixels – Aesthetic Wallpaper Gallery",
  description,
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "CozyPixels – Aesthetic Wallpaper Gallery",
    description,
    url: "./",
    images: [{ url: "og/home.png", width: 1200, height: 630, alt: "CozyPixels: soft colors for quiet screens" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CozyPixels – Aesthetic Wallpaper Gallery",
    description,
    images: ["og/home.png"],
  },
};

// Let content reach the screen edges on notched phones; safe-area insets pad it back in
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/SmoothScroll";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Defaults for no-JS; the head script swaps in the visitor's saved theme before first paint
    <html lang="en" data-theme="catppuccin" data-mode="dark" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1e1e2e" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Every wallpaper thumbnail comes from the resizing proxy (lib/image-loader.ts) */}
        <link rel="preconnect" href="https://wsrv.nl" />
      </head>
      <body className={`${inter.variable} font-sans antialiased theme-noise flex min-h-dvh flex-col bg-background text-foreground`}>
        <ThemeProvider>
          <Header />
          <SmoothScroll>
            <div className="flex-1">
              {children}
            </div>
          </SmoothScroll>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
