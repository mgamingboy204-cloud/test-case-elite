import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-12 px-6 md:px-12 border-t border-border/50 bg-background/80 backdrop-blur-md relative z-10 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-primary/20 border border-primary/50 flex flex-col items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-medium tracking-widest text-foreground">ELITE PLATFORM</span>
        </div>
        
        <div className="flex gap-6 text-sm text-foreground/50">
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
        </div>
        
        <div className="text-xs text-foreground/40">
          &copy; {new Date().getFullYear()} Elite Matchmaking. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
