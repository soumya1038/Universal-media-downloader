import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Headphones, Globe, Video, Wifi, WifiOff, Signal, HardDrive, Zap, Info } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Estimated sizes and network info per quality
const FORMAT_META = {
  '2160p': { estSizeMB: [3000, 8000], bitrate: '15–40 Mbps', network: 'fiber', networkLabel: 'Fiber / 5G', networkColor: '#22c55e', icon: Monitor },
  '1440p': { estSizeMB: [1500, 4000], bitrate: '8–20 Mbps', network: 'fast', networkLabel: 'Fast WiFi / 4G+', networkColor: '#22c55e', icon: Monitor },
  '1080p': { estSizeMB: [500, 1500], bitrate: '4–8 Mbps', network: 'good', networkLabel: 'Good WiFi / 4G', networkColor: '#84cc16', icon: Monitor },
  '720p':  { estSizeMB: [200, 600],  bitrate: '2–4 Mbps', network: 'moderate', networkLabel: 'Moderate WiFi / 3G+', networkColor: '#f59e0b', icon: Video },
  '480p':  { estSizeMB: [80, 250],   bitrate: '1–2 Mbps', network: 'slow', networkLabel: 'Slow WiFi / 3G', networkColor: '#f97316', icon: Smartphone },
  '360p':  { estSizeMB: [40, 120],   bitrate: '0.5–1 Mbps', network: 'slow', networkLabel: 'Any Connection', networkColor: '#f97316', icon: Smartphone },
  '240p':  { estSizeMB: [20, 60],    bitrate: '0.3–0.5 Mbps', network: 'any', networkLabel: 'Any Connection', networkColor: '#ef4444', icon: Smartphone },
  'audio': { estSizeMB: [5, 15],     bitrate: '128–320 kbps', network: 'any', networkLabel: 'Any Connection', networkColor: '#a78bfa', icon: Headphones },
};

const FALLBACK_OPTIONS = [
  { id: 'mp4-1080', label: 'MP4 1080p', format: 'mp4', quality: '1080p', type: 'video' },
  { id: 'mp4-720',  label: 'MP4 720p',  format: 'mp4', quality: '720p',  type: 'video' },
  { id: 'mp4-480',  label: 'MP4 480p',  format: 'mp4', quality: '480p',  type: 'video' },
  { id: 'mp3-audio',label: 'MP3 Audio', format: 'mp3', quality: 'audio', type: 'audio' },
  { id: 'webm-720', label: 'WEBM 720p', format: 'webm', quality: '720p', type: 'video' },
];

function NetworkBadge({ meta }) {
  if (!meta) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${meta.networkColor}18`, color: meta.networkColor, border: `1px solid ${meta.networkColor}30` }}>
      <Signal size={10} />
      {meta.networkLabel}
    </span>
  );
}

function FormatDetail({ option, durationSeconds }) {
  const meta = FORMAT_META[option.quality] || FORMAT_META['audio'];
  const hasRealSize = option.filesize && option.filesize > 0;
  const realSize = hasRealSize ? formatBytes(option.filesize) : null;

  // Estimate size from duration if available
  let estRange = null;
  if (!hasRealSize && durationSeconds && meta.estSizeMB) {
    const mins = durationSeconds / 60;
    const lo = Math.round(meta.estSizeMB[0] / 60 * mins);
    const hi = Math.round(meta.estSizeMB[1] / 60 * mins);
    if (lo > 0 && hi > 0) {
      const fmt = (mb) => mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
      estRange = `~${fmt(lo)} – ${fmt(hi)}`;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="mt-3 rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: 'rgba(255,126,103,0.05)', border: '1px solid rgba(255,126,103,0.15)' }}>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          style={{ color: 'var(--color-accent)' }}>
          <Info size={13} />
          Format Details
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Format */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--color-text-muted)' }}>Format</span>
            <span className="text-sm font-black uppercase" style={{ color: 'var(--color-text-primary)' }}>
              {option.format.toUpperCase()}
            </span>
          </div>

          {/* Quality */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--color-text-muted)' }}>Quality</span>
            <span className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>
              {option.quality === 'audio' ? 'Audio Only' : option.quality}
            </span>
          </div>

          {/* Bitrate */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--color-text-muted)' }}>Bitrate</span>
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {meta.bitrate}
            </span>
          </div>

          {/* File Size */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--color-text-muted)' }}>
              {hasRealSize ? 'File Size' : 'Est. Size'}
            </span>
            <span className="text-sm font-bold flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
              <HardDrive size={12} className="opacity-60" />
              {realSize || estRange || 'Varies'}
            </span>
          </div>
        </div>

        {/* Network recommendation */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Recommended for:
          </span>
          <NetworkBadge meta={meta} />
          {option.quality !== 'audio' && option.quality !== '2160p' && option.quality !== '1440p' && (
            <span className="text-[10px] opacity-50" style={{ color: 'var(--color-text-muted)' }}>
              {option.quality === '1080p' ? '• Best for most users' :
               option.quality === '720p'  ? '• Great balance of quality & size' :
               option.quality === '480p'  ? '• Saves data on mobile' :
               '• Minimal data usage'}
            </span>
          )}
          {option.quality === 'audio' && (
            <span className="text-[10px] opacity-50" style={{ color: 'var(--color-text-muted)' }}>• Music / Podcast only</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function FormatSelector({ selected, onSelect, availableFormats, durationSeconds }) {
  const options = useMemo(() => {
    if (!availableFormats || availableFormats.length === 0) return FALLBACK_OPTIONS;

    const dynamicOptions = [];
    const videoFormats = availableFormats.filter((f) => f.type === 'video');

    for (const vf of videoFormats) {
      dynamicOptions.push({
        id: `mp4-${vf.resolution}`,
        label: `MP4 ${vf.resolution}`,
        format: 'mp4',
        quality: vf.resolution,
        type: 'video',
        filesize: vf.filesize,
      });
    }

    if (videoFormats.length > 0) {
      const best = videoFormats[0];
      dynamicOptions.push({
        id: `webm-${best.resolution}`,
        label: `WEBM ${best.resolution}`,
        format: 'webm',
        quality: best.resolution,
        formatId: best.formatId,
        type: 'video',
        filesize: best.filesize,
      });
    }

    if (availableFormats.some((f) => f.type === 'audio')) {
      dynamicOptions.push({ id: 'mp3-audio', label: 'MP3 Audio', format: 'mp3', quality: 'audio', type: 'audio' });
    }

    return dynamicOptions.length > 0 ? dynamicOptions : FALLBACK_OPTIONS;
  }, [availableFormats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60" style={{ color: 'var(--color-text-primary)' }}>
        Choose Format
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {options.map((option, i) => {
          const isSelected = selected?.id === option.id;
          const meta = FORMAT_META[option.quality] || FORMAT_META['audio'];
          const Icon = meta.icon;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(option)}
              className={`btn-secondary text-center flex flex-col items-center gap-2 py-4 px-2 rounded-[24px] transition-all duration-300 ${isSelected ? 'active scale-105' : 'hover:scale-105'}`}
              id={`format-${option.id}`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent/10' : 'bg-white/5'}`}>
                <Icon size={18} className={isSelected ? 'text-accent' : 'text-gray-400'}
                  style={isSelected ? { color: 'var(--color-accent)' } : {}} />
              </div>
              <span className="text-xs font-bold leading-tight">{option.label}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">
                {option.format}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Detail panel for selected format */}
      <AnimatePresence>
        {selected && (
          <FormatDetail key={selected.id} option={selected} durationSeconds={durationSeconds} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
