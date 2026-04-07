import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clipboard, Search, Loader2, Link2 } from 'lucide-react';

export default function URLInput({ onAnalyze, isLoading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
      }
    } catch {
      // Clipboard API not available or permission denied — silently ignored
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <div className="glass-card !rounded-[32px] !p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Link2 size={18} className="text-accent" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Paste your media URL
          </h2>
        </div>
        <p className="text-xs font-medium mb-5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          YouTube • Instagram • Facebook • X • TikTok • Direct
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="glass-input w-full pr-12"
              disabled={isLoading}
              id="url-input"
            />
            {/* Paste from clipboard button */}
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1.5 transition-all duration-200 text-muted-foreground opacity-50 hover:opacity-100 hover:scale-110 active:scale-95"
              title="Paste from clipboard"
              disabled={isLoading}
              id="paste-button"
            >
              <Clipboard size={18} />
            </button>
          </div>
          <button
            type="submit"
            className="btn-primary min-w-[160px] !rounded-full !py-4 font-black uppercase tracking-widest text-xs"
            disabled={!url.trim() || isLoading}
            id="analyze-button"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={18} />
                Analyze
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
}
