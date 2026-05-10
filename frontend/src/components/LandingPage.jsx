import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Brain, Zap, Bell } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-7 h-7 text-emerald-400" />,
      title: "Learns Your Routine",
      desc: "Establishes a behavioral baseline from household activity."
    },
    {
      icon: <Bell className="w-7 h-7 text-cyan-400" />,
      title: "Intelligent Alerts",
      desc: "Context-aware anomaly detection with advanced reasoning."
    },
    {
      icon: <Zap className="w-7 h-7 text-blue-400" />,
      title: "Local & Samsung-Ready",
      desc: "Low latency, privacy-first, and offline-capable. Built as an intelligence layer for SmartThings integration."
    }
  ];

  return (
    <motion.div 
      key="landing"
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} 
      transition={{ duration: 0.5 }}
      className="relative min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 flex flex-col items-center text-center px-6 w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-300 font-medium">System Online</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 pb-2">
            ClawSentinel
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-slate-400 max-w-2xl font-light tracking-wide leading-relaxed">
            Turning smart homes into intelligent, self-protecting environments
          </p>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {features.map((feature, idx) => (
            <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-8 flex flex-col items-center text-center hover:bg-white/[0.04] transition-colors group">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white tracking-wide mb-3">{feature.title}</h3>
              <p className="text-sm font-light text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.button
          onClick={() => navigate("/dashboard")}
          className="mt-14 group relative px-8 py-4 rounded-full bg-white text-slate-950 font-medium tracking-wide overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(20,184,166,0.3)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-3 group-hover:text-white transition-colors duration-300">
            Initialize Dashboard
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
