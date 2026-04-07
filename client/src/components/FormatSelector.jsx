import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Headphones, Globe, Video, FileAudio } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const FORMAT_ICONS = {
  '2160p': Monitor,
  '1440p': Monitor,
  '1080p': Monitor,
  '720p': Video,
  '480p': Smartphone,
  '360p': Smartphone,
  '240p': Smartphone,
  'audio': Headphones,
};

const FALLBACK_OPTIONS = [
  { id: 'mp4-1080', label: 'MP4 1080p', format: 'mp4', quality: '1080p', icon: Monitor, type: 'video' },
  { id: 'mp4-720', label: 'MP4 720p', format: 'mp4', quality: '720p', icon: Video, type: 'video' },
  { id: 'mp4-480', label: 'MP4 480p', format: 'mp4', quality: '480p', icon: Smartphone, type: 'video' },
  { id: 'mp3-audio', label: 'MP3 Audio', format: 'mp3', quality: 'audio', icon: Headphones, type: 'audio' },
  { id: 'webm-720', label: 'WEBM 720p', format: 'webm', quality: '720p', icon: Globe, type: 'video' },
];

export default function FormatSelector({ selected, onSelect, availableFormats }) {
  const options = useMemo(() => {
    if (!availableFormats || availableFormats.length === 0) {
      return FALLBACK_OPTIONS;
    }

    const dynamicOptions = [];

    // Build video format options from available formats
    const videoFormats = availableFormats.filter((f) => f.type === 'video');
    for (const vf of videoFormats) {
      // MP4 option
      dynamicOptions.push({
        id: `mp4-${vf.resolution}`,
        label: `MP4 ${vf.resolution}`,
        format: 'mp4',
        quality: vf.resolution,
        icon: FORMAT_ICONS[vf.resolution] || Video,
        type: 'video',
      });
    }

    // Add WebM option for the best available resolution
    if (videoFormats.length > 0) {
      const best = videoFormats[0];
      dynamicOptions.push({
        id: `webm-${best.resolution}`,
        label: `WEBM ${best.resolution}`,
        format: 'webm',
        quality: best.resolution,
        formatId: best.formatId,
        icon: Globe,
        type: 'video',
      });
    }

    // Add audio-only option
    const hasAudio = availableFormats.some((f) => f.type === 'audio');
    if (hasAudio) {
      dynamicOptions.push({
        id: 'mp3-audio',
        label: 'MP3 Audio',
        format: 'mp3',
        quality: 'audio',
        icon: Headphones,
        type: 'audio',
      });
    }

    return dynamicOptions.length > 0 ? dynamicOptions : FALLBACK_OPTIONS;
  }, [availableFormats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card"
    >
      <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60" style={{ color: 'var(--color-text-primary)' }}>
        Choose Format
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {options.map((option, i) => {
          const isSelected = selected?.id === option.id;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(option)}
              className={`btn-secondary text-center flex flex-col items-center gap-3 py-5 px-3 rounded-[32px] transition-all duration-500 ${isSelected ? 'active scale-105' : 'hover:scale-105'}`}
              id={`format-${option.id}`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent/10' : 'bg-white/5'}`}>
                <Icon size={20} className={isSelected ? 'text-accent' : 'text-gray-400'} />
              </div>
              <span className="text-xs font-bold truncate w-full">{option.label}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">
                {option.filesize ? formatBytes(option.filesize) : option.format}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
