import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, HardDrive, Info, Monitor, Signal, Smartphone, Video, Wifi } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function getNetworkLabel(option, durationSeconds) {
  const internetBytes = option.estimatedInternetBytes || option.filesize || null;
  if (!internetBytes || !durationSeconds) return 'Variable Network';

  const mbPerMinute = (internetBytes / (1024 * 1024)) / (durationSeconds / 60);
  if (mbPerMinute >= 120) return 'Fiber / 5G Recommended';
  if (mbPerMinute >= 60) return 'Fast WiFi / 5G';
  if (mbPerMinute >= 30) return 'Stable WiFi / 4G';
  if (mbPerMinute >= 12) return 'WiFi / 4G';
  return 'Any Connection';
}

function getMethodLabel(method) {
  if (method === 'spotify-youtube-search') return 'Spotify metadata -> YouTube source';
  if (method === 'blocked-drm') return 'DRM blocked';
  return 'Direct source download';
}

function getOptionIcon(option) {
  if (option.type === 'audio') return Headphones;
  if (option.quality === '240p' || option.quality === '360p') return Smartphone;
  if (option.quality === '720p' || option.quality === '480p') return Video;
  return Monitor;
}

const FALLBACK_OPTIONS = [
  { id: 'mp4-1080p', label: 'MP4 1080p', format: 'mp4', quality: '1080p', type: 'video' },
  { id: 'mp4-720p', label: 'MP4 720p', format: 'mp4', quality: '720p', type: 'video' },
  { id: 'webm-720p', label: 'WEBM 720p', format: 'webm', quality: '720p', type: 'video' },
  { id: 'mp3-192k', label: 'MP3 192k', format: 'mp3', quality: '192k', type: 'audio' },
];

function buildFallbackFromFormats(availableFormats = []) {
  const derived = [];
  const videoFormats = availableFormats.filter((format) => format.type === 'video');

  for (const video of videoFormats.slice(0, 4)) {
    derived.push({
      id: `mp4-${video.resolution}`,
      label: `MP4 ${video.resolution}`,
      format: 'mp4',
      quality: video.resolution,
      type: 'video',
      formatId: video.formatId,
      filesize: video.filesize || null,
    });
  }

  if (videoFormats.length > 0) {
    const bestVideo = videoFormats[0];
    derived.push({
      id: `webm-${bestVideo.resolution}`,
      label: `WEBM ${bestVideo.resolution}`,
      format: 'webm',
      quality: bestVideo.resolution,
      type: 'video',
      formatId: bestVideo.formatId,
      filesize: bestVideo.filesize || null,
    });
  }

  if (availableFormats.some((format) => format.type === 'audio')) {
    derived.push({
      id: 'mp3-192k',
      label: 'MP3 192k',
      format: 'mp3',
      quality: '192k',
      type: 'audio',
    });
  }

  return derived.length > 0 ? derived : FALLBACK_OPTIONS;
}

function FormatDetail({ option, durationSeconds }) {
  const networkLabel = getNetworkLabel(option, durationSeconds);
  const internet = formatBytes(option.estimatedInternetBytes || option.filesize || null);
  const storage = formatBytes(option.estimatedStorageBytes || option.filesize || null);
  const working = formatBytes(option.estimatedWorkingSpaceBytes || null);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div
        className="mt-3 rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: 'rgba(255,126,103,0.05)', border: '1px solid rgba(255,126,103,0.15)' }}
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>
          <Info size={13} />
          Option Details
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-black uppercase opacity-60">Internet Data Needed</p>
            <p className="mt-1 font-bold">{internet}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-black uppercase opacity-60">Device Space Needed</p>
            <p className="mt-1 font-bold">{storage}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-black uppercase opacity-60">Working Space Needed</p>
            <p className="mt-1 font-bold">{working}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            <Signal size={11} />
            {networkLabel}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            <Wifi size={11} />
            {getMethodLabel(option.downloadMethod)}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            <HardDrive size={11} />
            {String(option.format || '').toUpperCase()} {option.quality}
          </span>
        </div>

        {option.description && (
          <p className="text-xs opacity-75">{option.description}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function FormatSelector({
  selected,
  onSelect,
  availableFormats,
  downloadOptions,
  durationSeconds,
  allowFallback = true,
}) {
  const options = useMemo(() => {
    if (Array.isArray(downloadOptions) && downloadOptions.length > 0) return downloadOptions;
    if (!allowFallback) return [];
    return buildFallbackFromFormats(Array.isArray(availableFormats) ? availableFormats : []);
  }, [downloadOptions, availableFormats, allowFallback]);

  if (options.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold opacity-80">
        No downloadable formats found for this media.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60" style={{ color: 'var(--color-text-primary)' }}>
        Choose Format
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((option, i) => {
          const isSelected = selected?.id === option.id;
          const Icon = getOptionIcon(option);
          const quickData = formatBytes(option.estimatedInternetBytes || option.filesize || null);

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(option)}
              className={`btn-secondary text-center flex flex-col items-center gap-2 py-4 px-2 rounded-[24px] transition-all duration-300 ${
                isSelected ? 'active scale-105' : 'hover:scale-105'
              }`}
              id={`format-${option.id}`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent/10' : 'bg-white/5'}`}>
                <Icon
                  size={18}
                  className={isSelected ? 'text-accent' : 'text-gray-400'}
                  style={isSelected ? { color: 'var(--color-accent)' } : {}}
                />
              </div>
              <span className="text-xs font-bold leading-tight">{option.label}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">
                {option.format} {option.quality}
              </span>
              <span className="text-[9px] font-semibold opacity-60">Data: {quickData}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && <FormatDetail key={selected.id} option={selected} durationSeconds={durationSeconds} />}
      </AnimatePresence>
    </motion.div>
  );
}
