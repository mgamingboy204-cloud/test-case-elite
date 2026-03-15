export default function Apply() {
  return (
    <div className="min-h-[80vh] py-32 px-6 md:px-12 flex flex-col items-center justify-center text-center pointer-events-auto">
      <span className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-8">
        <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_var(--color-primary)] animate-pulse" />
      </span>
      <h1 className="text-4xl md:text-6xl font-light mb-6 text-foreground">Request an <span className="font-semibold text-primary italic">Invitation</span></h1>
      <p className="text-xl text-foreground/60 font-light max-w-2xl mb-12 leading-relaxed">
        Membership to VAEL is highly selective. Please leave your details, and our concierge team will reach out if we feel you align with our active network.
      </p>
      
      <form className="w-full max-w-md flex flex-col gap-4 text-left">
        <div>
          <label className="text-sm text-foreground/70 mb-2 block">Full Name</label>
          <input type="text" className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border/50 text-foreground focus:outline-none focus:border-primary transition-colors backdrop-blur-md" placeholder="Enter your full name" />
        </div>
        <div>
          <label className="text-sm text-foreground/70 mb-2 block">LinkedIn Profile</label>
          <input type="url" className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border/50 text-foreground focus:outline-none focus:border-primary transition-colors backdrop-blur-md" placeholder="https://linkedin.com/in/..." />
        </div>
        <div>
          <label className="text-sm text-foreground/70 mb-2 block">Email Inquiry</label>
          <input type="email" className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border/50 text-foreground focus:outline-none focus:border-primary transition-colors backdrop-blur-md" placeholder="Enter your email" />
        </div>
        <button type="button" className="mt-6 w-full py-4 rounded-lg bg-primary text-background font-medium hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(183,110,121,0.4)] transition-all">
          Submit Application
        </button>
      </form>
    </div>
  );
}
