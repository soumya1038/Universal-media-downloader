import React from 'react';
import { motion } from 'framer-motion';
import { User, Globe, Clock, Film, ExternalLink } from 'lucide-react';

export default function VideoPreview({ metadata }) {
  if (!metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card overflow-hidden"
      id="video-preview"
    >
      <div className="flex flex-col md:flex-row gap-5">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-full md:w-72 aspect-video rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
               <Film size={48} className="text-white/20" />
            </div>
          )}
          {/* Duration badge */}
          {metadata.duration && (
            <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border border-white/10"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
              {metadata.duration}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <h3 className="text-lg font-display font-bold mb-3 leading-tight line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
            {metadata.title}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {metadata.author && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <User size={14} className="text-accent" style={{ color: 'var(--color-accent)' }} /> 
                <span className="truncate max-w-[120px]">{metadata.author}</span>
              </span>
            )}
            {metadata.platform && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Globe size={14} className="text-blue-400" />
                <span className="capitalize">{metadata.platform}</span>
              </span>
            )}
            {metadata.duration && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Clock size={14} className="text-amber-400" /> 
                {metadata.duration}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
