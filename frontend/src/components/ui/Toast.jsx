import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import useSystemStore from "../../store/useSystemStore";

export default function Toast() {
  const notification = useSystemStore((state) => state.notification);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] min-w-[320px]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-slate-900/90 p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(244,63,94,0.15)]">
            {/* Progress bar */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-rose-500"
            />
            
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold tracking-tight text-white uppercase">System Alert</p>
                <p className="text-xs text-rose-200/70 font-medium mt-0.5">{notification.message}</p>
              </div>
              <button 
                onClick={() => setVisible(false)}
                className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
