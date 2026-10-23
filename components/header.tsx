import Link from "next/link";
import Image from "next/image";
import { Info } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import logoPic from "@/lib/assets/logo.webp";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full pt-[env(safe-area-inset-top)] border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] h-16 flex items-center justify-between">
        <Link href="/" className="flex min-h-11 items-center gap-2 md:gap-3 transition-opacity hover:opacity-80">
          <Image 
            src={logoPic} 
            alt="CozyPixels Logo" 
            width={40} 
            height={40} 
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover shadow-sm"
          />
          <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Cozy<span className="text-primary">Pixels</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Credits and the takedown route are one tap away on every page */}
          <Link
            href="/about"
            aria-label="About and credits"
            className="relative inline-flex items-center rounded-lg border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground after:absolute after:-inset-1 after:content-[''] md:border-transparent md:bg-transparent md:px-3 md:py-1.5 md:text-sm md:font-medium md:text-muted-foreground md:hover:bg-transparent md:hover:text-foreground"
          >
            <Info className="h-4 w-4 md:hidden" aria-hidden />
            <span className="hidden md:inline">About</span>
          </Link>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
