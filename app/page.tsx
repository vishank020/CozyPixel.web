import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { manifest, getWallpapersByTheme, getImageUrl } from "@/lib/manifest";
import { themes } from "@/lib/themes";
import { FeaturedStrip } from "@/components/featured-strip";

export default function Home() {
  const themeIds = ["catppuccin", "nord", "onedark"] as const;

  // Grab some specific wallpapers for the hero collage
  const heroCatppuccin = getWallpapersByTheme("Catppuccin")[1] || manifest.wallpapers[0];
  const heroNord = getWallpapersByTheme("Nord")[3] || manifest.wallpapers[1];
  const heroOneDark = getWallpapersByTheme("One Dark")[2] || manifest.wallpapers[2];

  // Grab 8 featured wallpapers for the strip
  const featuredWallpapers = [
    ...(getWallpapersByTheme("Catppuccin").slice(15, 18)),
    ...(getWallpapersByTheme("Nord").slice(8, 11)),
    ...(getWallpapersByTheme("One Dark").slice(5, 7)),
  ];

  return (
    <main className="flex flex-col min-h-screen relative overflow-hidden">
      
      {/* 
        Subtle ambient background effects. 
        Using existing CSS vars (primary) for a soft, glowing orb effect. 
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-primary/10 blur-[150px] mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4">
        
        {/* 1. Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-12 min-h-[85vh] py-12 md:py-20">
          
          {/* Hero Text */}
          <div className="flex-1 space-y-8 z-10 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Aesthetic Desktop Wallpapers</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Soft colors for <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                quiet screens.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto md:mx-0">
              A curated collection of cozy, high-quality aesthetic wallpapers. 
              Featuring <strong>Catppuccin</strong>, <strong>Nord</strong>, and <strong>One Dark</strong> themes for a beautifully cohesive digital setup.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
              <Link
                href="#themes"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Explore Wallpapers
              </Link>
              <a
                href="https://github.com/SleepyCatHey/CozyPixels"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-background px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary hover:text-secondary-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>

          {/* Hero Visual Collage (Hidden on small mobile for cleaner layout) */}
          <div className="flex-1 relative w-full hidden sm:flex items-center justify-center min-h-[400px] md:min-h-[500px]">
            <div className="relative w-full max-w-lg aspect-square">
              
              {/* Bottom Left Image (One Dark) */}
              <div className="absolute top-1/4 -left-8 w-2/3 aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-border/50 z-10 opacity-70 blur-[2px] transition-all duration-700 hover:opacity-100 hover:blur-none hover:z-40 hover:scale-105 will-change-transform transform -rotate-6">
                {heroOneDark && (
                  <Image src={getImageUrl(heroOneDark)} alt="One Dark preview" fill className="object-cover" unoptimized priority />
                )}
              </div>
              
              {/* Top Right Image (Nord) */}
              <div className="absolute top-0 -right-4 w-2/3 aspect-[16/10] rounded-2xl overflow-hidden shadow-xl border border-border/50 z-20 opacity-80 blur-[1px] transition-all duration-700 hover:opacity-100 hover:blur-none hover:z-40 hover:scale-105 will-change-transform transform rotate-6">
                {heroNord && (
                  <Image src={getImageUrl(heroNord)} alt="Nord preview" fill className="object-cover" unoptimized priority />
                )}
              </div>
              
              {/* Front Center Image (Catppuccin) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border border-border z-30 transition-transform duration-700 hover:scale-105 will-change-transform">
                {heroCatppuccin && (
                  <Image src={getImageUrl(heroCatppuccin)} alt="Catppuccin preview" fill className="object-cover" unoptimized priority />
                )}
              </div>

            </div>
          </div>
        </section>


        {/* 2. Theme Showcase Section */}
        <section id="themes" className="py-24 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Choose your aesthetic
            </h2>
            <p className="text-muted-foreground">
              Three distinct palettes meticulously crafted for long coding sessions and cozy desktops.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {themeIds.map((id) => {
              const themeMeta = themes[id];
              const manifestTheme = manifest.themes[themeMeta.name];
              const count = manifestTheme ? manifestTheme.count : 0;
              
              // Get 3 sample wallpapers for this theme's card
              const samples = getWallpapersByTheme(themeMeta.name).slice(0, 3);

              return (
                <Link
                  key={id}
                  href={`/${id}`}
                  className="group flex flex-col rounded-3xl overflow-hidden bg-card border border-border/60 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="p-8 pb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {themeMeta.name}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {count}+
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {themeMeta.description}
                    </p>
                  </div>

                  {/* Card Visual / Thumbnails */}
                  <div className="mt-auto p-4 pt-0">
                    <div className="flex gap-2">
                      {samples.map((sample, idx) => (
                        <div 
                          key={sample.id} 
                          className={`relative flex-1 aspect-[4/3] rounded-xl overflow-hidden border border-border/50 ${idx === 2 ? 'hidden sm:block lg:hidden xl:block' : ''}`}
                        >
                          <Image
                            src={getImageUrl(sample)}
                            alt={sample.filename}
                            fill
                            sizes="20vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110 will-change-transform"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-8 py-5 bg-secondary/30 border-t border-border/30 flex items-center justify-between text-sm font-medium text-foreground transition-colors group-hover:bg-primary/5">
                    Browse collection
                    <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1 text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>


        {/* 3. Featured Wallpapers Strip */}
        <section className="py-24 border-t border-border/30">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Featured Picks
            </h2>
          </div>
          
          <FeaturedStrip wallpapers={featuredWallpapers} />
        </section>


        {/* 4. Philosophy / About strip */}
        <section className="py-24">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-card border border-border/60 shadow-lg px-6 py-16 md:px-16 md:py-20 text-center max-w-5xl mx-auto flex flex-col items-center gap-8">
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground relative z-10">
              Free forever. Made with care.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed relative z-10">
              CozyPixels is an open-source, community-driven project designed to bring beautiful, relaxing aesthetics to everyone's screen without any cost, ads, or tracking. Wallpapers that feel like a deep breath.
            </p>
            
            <a
              href="https://github.com/SleepyCatHey/CozyPixels"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline relative z-10 mt-2"
            >
              Support the project on GitHub <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}
