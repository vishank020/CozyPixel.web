import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

const SOURCE_REPO = "https://github.com/SleepyCatHey/CozyPixels";
const SITE_REPO = "https://github.com/vishank020/CozyPixel.web";

const title = "About & credits · CozyPixels";
const description =
  "Who made the CozyPixels wallpapers, how artists can request credit or removal, and what this site does (and doesn't) do with your data.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "about" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title,
    description,
    url: "about",
    images: [{ url: "og/home.png", width: 1200, height: 630 }],
  },
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <span className="text-primary" aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-3 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

const linkClass = "font-medium text-primary hover:underline";

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 sm:py-16 space-y-6">
      <header className="space-y-4 pb-2 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          About
        </p>
        <h1 className="text-section font-extrabold tracking-tight text-foreground">About &amp; credits</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          {SITE_NAME} is a free, open-source gallery for browsing and downloading the CozyPixels wallpaper
          collection. It shows and links to the images; it doesn&apos;t own them.
        </p>
      </header>

      <Section icon={<Heart className="h-5 w-5" />} title="The collection">
        <p>
          Every wallpaper, and the work of gathering, sorting and sharing them, belongs to{" "}
          <a href="https://github.com/SleepyCatHey" target="_blank" rel="noopener noreferrer" className={linkClass}>
            SleepyCatHey
          </a>
          . The images live in the{" "}
          <a href={SOURCE_REPO} target="_blank" rel="noopener noreferrer" className={linkClass}>
            original CozyPixels repository
          </a>
          , and downloads here come straight from it. If you enjoy them, a star there is a nice thank-you.
        </p>
      </Section>

      <Section icon={<ExternalLink className="h-5 w-5" />} title="Artists: credit or removal">
        <p>
          <strong className="text-foreground">Disclaimer:</strong> most wallpapers in the original CozyPixels
          collection were saved from various social media platforms without tracking sources.
        </p>
        <p>
          If you recognize your work and would like credit or removal, please{" "}
          <a
            href={`${SOURCE_REPO}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            open an issue on the original repository
          </a>
          . Once a wallpaper is credited or removed there, this site picks it up on its next update.
        </p>
      </Section>

      <Section icon={<ShieldCheck className="h-5 w-5" />} title="Privacy">
        <p>No accounts, no ads, no cookies and no analytics or tracking.</p>
        <p>
          Your theme and light/dark choice are saved only in your own browser. Wallpaper images load from
          GitHub, jsDelivr and the wsrv.nl image service, which, like any website, receive standard request
          details such as your IP address.
        </p>
      </Section>

      <Section icon={<Sparkles className="h-5 w-5" />} title="This website">
        <p>
          Built by{" "}
          <a href="https://github.com/vishank020" target="_blank" rel="noopener noreferrer" className={linkClass}>
            vishank020
          </a>
          . The site&apos;s code is open source under the{" "}
          <a href={`${SITE_REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className={linkClass}>
            MIT license
          </a>
          ; the license covers the code only, not the wallpapers.
        </p>
      </Section>

      <div className="pt-4 text-center">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:underline">
          Browse the wallpapers <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </main>
  );
}
