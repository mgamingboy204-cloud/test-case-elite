export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-32 px-6 md:px-12 max-w-4xl mx-auto flex flex-col pointer-events-auto">
      <h1 className="text-4xl md:text-5xl font-light mb-12 text-foreground">Privacy <span className="font-semibold text-primary">Policy</span></h1>
      <div className="prose prose-invert prose-lg text-foreground/70 font-light leading-relaxed">
        <p className="mb-6">VAEL platform values the privacy and security of our exclusive members above all else. This document outlines how we protect and manage your data.</p>
        
        <h2 className="text-2xl text-foreground font-medium mt-12 mb-4">1. Data Collection</h2>
        <p className="mb-6">We only collect information necessary to provide you with meaningful, curated introductions. This includes preference data, demographic information, and encrypted platform interactions.</p>
        
        <h2 className="text-2xl text-foreground font-medium mt-12 mb-4">2. Zero Unauthorized Sharing</h2>
        <p className="mb-6">Your data is never sold, traded, or shared with third parties. Your profile is only visible to the specific matches curated for you by our concierge algorithm.</p>
        
        <h2 className="text-2xl text-foreground font-medium mt-12 mb-4">3. Security</h2>
        <p className="mb-6">We employ enterprise-grade encryption and strict access controls to ensure your personal information remains confidential at all times.</p>
      </div>
    </div>
  );
}
