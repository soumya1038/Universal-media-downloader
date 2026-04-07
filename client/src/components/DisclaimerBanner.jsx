import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="w-full px-4 py-3 flex items-center justify-between gap-4 text-xs"
        style={{
          background: 'rgba(245,158,11,0.1)',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          color: 'var(--color-warning)',
        }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
          <p className="font-medium">
            <strong>Disclaimer:</strong> Only download media you own or have permission to use. This tool does not bypass DRM.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 px-2 py-1 rounded text-xs font-medium bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--color-warning)' }}
        >
          <X size={16} strokeWidth={3} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
