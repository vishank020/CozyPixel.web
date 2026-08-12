import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CozyPixels – Aesthetic Wallpaper Gallery",
  description:
    "Free cozy wallpapers in Catppuccin, Nord and One Dark themes. Open source & free forever.",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased theme-noise flex min-h-screen flex-col bg-background text-foreground`}>
        <ThemeProvider defaultTheme="catppuccin" defaultMode="system">
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
