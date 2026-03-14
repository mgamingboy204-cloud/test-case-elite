"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Video } from "lucide-react";
import { motion } from "framer-motion";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Super Admin", icon: Shield, href: "/admin" },
    { label: "Matches Agent", icon: Users, href: "/agent" },
    { label: "Verify Vault", icon: Video, href: "/verify" },
  ];

  return (
    <div className="flex w-full h-[100dvh] bg-[#0a0c10] text-[#f4f4f5] overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 border-r border-[#1f222b] bg-[#0a0c10]/50 backdrop-blur-md flex flex-col z-20">
        <div className="p-8 pb-12">
           <h1 className="font-serif text-2xl tracking-widest text-white uppercase">Command</h1>
           <p className="text-[10px] text-[#C89B90] tracking-[0.2em] mt-1 uppercase">Elite Control</p>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`relative px-4 py-3 rounded-lg flex items-center gap-4 transition-colors ${
                  isActive ? "text-[#C89B90]" : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="console-nav-active"
                    className="absolute inset-0 bg-[#C89B90]/10 rounded-lg border border-[#C89B90]/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="text-sm font-medium tracking-wide relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#1f222b]">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#1f222b] flex items-center justify-center border border-[#C89B90]/30">
               <span className="text-xs text-[#C89B90] font-serif">SL</span>
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-serif text-white">System Lead</span>
               <span className="text-[10px] text-white/40 uppercase tracking-wider">Online</span>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
          {/* Subtle Global Background FX */}
          <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C89B90]/5 to-transparent rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none z-0" />
          
          <div className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </div>
      </main>
    </div>
  );
}
