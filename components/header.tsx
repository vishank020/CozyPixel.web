import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 transition-opacity hover:opacity-80">
          <Image 
            src="/logo.png" 
            alt="CozyPixels Logo" 
            width={40} 
            height={40} 
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover shadow-sm"
          />
          <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Cozy<span className="text-primary">Pixels</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
