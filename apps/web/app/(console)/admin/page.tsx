"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MoreVertical, ShieldCheck, Flag, Ban, Eye } from "lucide-react";

// Mock Data
const METRICS = [
  { label: "Total Members", value: "1,248" },
  { label: "Revenue (MTD)", value: "$4.12M" },
  { label: "Active Rendezvous", value: "34" },
  { label: "Pending Verifications", value: "12" },
];

const MOCK_USERS = [
  { id: "1", name: "Alexander Vance", age: 34, profession: "Hedge Fund Manager", signup: "2026-03-10", agent: "Julian" },
  { id: "2", name: "Isabella Rossi", age: 29, profession: "Creative Director", signup: "2026-03-11", agent: "Julian" },
  { id: "3", name: "Marcus Chen", age: 41, profession: "Neurosurgeon", signup: "2026-03-09", agent: "Sarah" },
  { id: "4", name: "Eleanor Wright", age: 31, profession: "Tech Founder", signup: "2026-03-12", agent: "Julian" },
  { id: "5", name: "David Kim", age: 38, profession: "Architect", signup: "2026-03-08", agent: "Marcus" },
];

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.profession.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full p-10 flex flex-col gap-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-white tracking-wide uppercase">Super Admin</h1>
        <p className="text-xs text-white/40 uppercase tracking-widest mt-2">The Nerve Center</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        {METRICS.map((metric, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={metric.label} 
            className="p-6 rounded-xl border border-[#1f222b] bg-[#0a0c10]/80 backdrop-blur-sm relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#C89B90]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#C89B90]/10 transition-colors" />
             <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 relative z-10">{metric.label}</p>
             <p className="text-3xl font-light text-[#C89B90] relative z-10">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="flex-1 flex flex-col rounded-xl border border-[#1f222b] bg-[#0a0c10]/80 backdrop-blur-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#1f222b] flex items-center justify-between">
           <div className="relative w-96">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C89B90]" />
             <input 
               type="text" 
               placeholder="Search registry..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-[#1f222b]/50 border-b border-transparent focus:border-[#C89B90] py-2 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
             />
           </div>
           <div className="text-[10px] text-white/30 uppercase tracking-wider">
             {filteredUsers.length} records found
           </div>
        </div>

        {/* Dense Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0a0c10]/95 backdrop-blur z-10 border-b border-[#1f222b]">
              <tr>
                <th className="py-4 px-6 text-[10px] font-medium text-white/40 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-[10px] font-medium text-white/40 uppercase tracking-wider">Age</th>
                <th className="py-4 px-6 text-[10px] font-medium text-white/40 uppercase tracking-wider">Profession</th>
                <th className="py-4 px-6 text-[10px] font-medium text-white/40 uppercase tracking-wider">Signup Date</th>
                <th className="py-4 px-6 text-[10px] font-medium text-white/40 uppercase tracking-wider">Agent</th>
                <th className="py-4 px-6 text-right text-[10px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f222b]/50">
              {filteredUsers.map((user, i) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  key={user.id} 
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="py-3 px-6 text-sm font-serif text-white">{user.name}</td>
                  <td className="py-3 px-6 text-sm font-sans text-white/70">{user.age}</td>
                  <td className="py-3 px-6 text-sm font-sans text-[#C89B90]">{user.profession}</td>
                  <td className="py-3 px-6 text-xs font-sans text-white/50">{user.signup}</td>
                  <td className="py-3 px-6 text-xs font-sans text-white/50 tracking-wider uppercase">{user.agent}</td>
                  <td className="py-3 px-6 text-right relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                      className="p-2 rounded hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Action Dropdown */}
                    {activeMenu === user.id && (
                      <div className="absolute right-12 top-2 w-56 bg-[#0a0c10] border border-[#1f222b] rounded-lg shadow-2xl z-50 overflow-hidden text-left flex flex-col">
                         <button className="px-4 py-3 text-xs flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full">
                           <Eye size={14} className="text-[#C89B90]" /> View Full Portfolio
                         </button>
                         <button className="px-4 py-3 text-xs flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full">
                           <ShieldCheck size={14} className="text-emerald-500" /> Manually Verify
                         </button>
                         <button className="px-4 py-3 text-xs flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full border-t border-[#1f222b]">
                           <Flag size={14} className="text-amber-500" /> Flag for Review
                         </button>
                         <button className="px-4 py-3 text-xs flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full">
                           <Ban size={14} /> Revoke Membership
                         </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
