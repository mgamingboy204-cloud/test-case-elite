export default function TermsOfService() {
  return (
    <div className="min-h-screen py-32 px-6 md:px-12 max-w-4xl mx-auto flex flex-col pointer-events-auto">
      <h1 className="text-4xl md:text-5xl font-light mb-12 text-foreground">Terms of <span className="font-semibold text-primary">Service</span></h1>
      <div className="prose prose-invert prose-lg text-foreground/70 font-light leading-relaxed">
        <p className="mb-6">Welcome to VAEL. By accessing our platform, configuring an account, or requesting an invitation, you implicitly accept these highly exclusive terms of service.</p>
        
        <h2 className="text-2xl text-foreground font-medium mt-12 mb-4">1. Membership Eligibility</h2>
        <p className="mb-6">Membership is granted strictly on an invitation and review basis. VAEL reserves the unilateral right to deny or revoke access to maintain the integrity of our network.</p>
        
        <h2 className="text-2xl text-foreground font-medium mt-12 mb-4">2. Code of Conduct</h2>
        <p className="mb-6">Members are expected to interact with the utmost respect, discretion, and intention. Any violation of privacy protocols or inappropriate behavior will result in an immediate, permanent ban.</p>
        
        <h2 className="text-2xl text-foreground font-medium mt-12 mb-4">3. Intellectual Property</h2>
        <p className="mb-6">The VAEL platform, its design system, algorithm, and 3D architectural implementations are protected proprietary assets.</p>
      </div>
    </div>
  );
}
