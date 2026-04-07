import React from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';

export default function DownloadButton({ onClick, disabled, isLoading }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || isLoading}
      className="btn-primary w-full text-xs font-black uppercase tracking-[0.2em] py-5 !rounded-full shadow-2xl"
      id="download-button"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin" />
          Preparing Download...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Download size={24} strokeWidth={2.5} />
          Start Download
        </span>
      )}
    </motion.button>
  );
}
