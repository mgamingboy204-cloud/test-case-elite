import { Mail, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-[80vh] py-32 px-6 md:px-12 flex flex-col items-center justify-center text-center pointer-events-auto">
      <h1 className="text-4xl md:text-5xl font-light mb-6 text-foreground">Direct <span className="font-semibold text-primary italic">Concierge</span></h1>
      <p className="text-xl text-foreground/60 font-light max-w-2xl mb-16 leading-relaxed">
        For press inquiries, existing member support, or partnership opportunities, reach our private team below.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl w-full">
        <div className="flex flex-col items-center p-8 bg-background/20 backdrop-blur-md rounded-3xl border border-border/50">
          <Mail className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-medium mb-2">Concierge Email</h3>
          <p className="text-foreground/70 font-light">concierge@elitematch.app</p>
        </div>
        <div className="flex flex-col items-center p-8 bg-background/20 backdrop-blur-md rounded-3xl border border-border/50">
          <MapPin className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-xl font-medium mb-2">Global Headquarters</h3>
          <p className="text-foreground/70 font-light">Available strictly by appointment.</p>
        </div>
      </div>
    </div>
  );
}
