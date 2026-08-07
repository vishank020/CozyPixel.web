import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="max-w-2xl text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Disclaimer:</strong> Most wallpapers in the original CozyPixels collection were saved from various social media platforms without tracking sources.
            </p>
            <p>
              If you recognize your work and would like credit or removal, please{" "}
              <a 
                href="https://github.com/SleepyCatHey/CozyPixels/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                open an issue on the original repository
              </a>.
            </p>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-4">
            Built with <Heart className="h-3.5 w-3.5 text-destructive" /> for the community.
          </p>
        </div>
      </div>
    </footer>
  );
}
