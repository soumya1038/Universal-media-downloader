import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Layers, Trash2, Moon, Cpu, ChevronDown } from 'lucide-react';

const DEFAULT_SETTINGS = {
  defaultFormat: 'mp4-720',
  autoDelete: true,
  darkMode: true,
  disableBackground: false,
};

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative shrink-0 cursor-pointer border-none"
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        background: enabled ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
        transition: 'background 0.3s',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-checked={enabled}
      role="switch"
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: enabled ? 27 : 3,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: enabled ? '#0a0a1a' : 'var(--color-text-muted)',
          transition: 'left 0.2s ease',
          display: 'block',
        }}
      />
    </button>
  );
}

const settingRows = [
  {
    key: 'autoDelete',
    icon: Trash2,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/10',
    label: 'Auto Delete Completed Files',
    desc: 'Automatically remove local records after 24 hours.',
  },
  {
    key: 'darkMode',
    icon: Moon,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-400/10',
    label: 'Dark Mode',
    desc: 'Use premium dark theme interface.',
  },
  {
    key: 'disableBackground',
    icon: Cpu,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-400/10',
    label: 'Disable Animated Background',
    desc: 'Turn off the 3D scene for better performance on older devices.',
  },
];

export default function Settings({ onBackgroundToggle }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaDownloaderSettings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('mediaDownloaderSettings', JSON.stringify(settings));
    if (onBackgroundToggle) onBackgroundToggle(settings.disableBackground);
  }, [settings, onBackgroundToggle]);

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container-app py-8 md:py-16"
      style={{ maxWidth: 640, margin: '0 auto' }}
    >
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon size={28} style={{ color: 'var(--color-accent)' }} />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight">Settings</h1>
      </div>

      <div className="space-y-4">
        {/* Default format */}
        <div className="glass-card !rounded-2xl sm:!rounded-[32px]">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Default Download Format
            </h3>
          </div>
          <div className="relative">
            <select
              value={settings.defaultFormat}
              onChange={(e) => update('defaultFormat', e.target.value)}
              className="glass-input cursor-pointer pr-10 appearance-none text-sm"
              style={{ fontSize: 14 }}
            >
              <option value="mp4-1080" style={{ background: 'var(--bg-color-mid)' }}>MP4 1080p (High Quality)</option>
              <option value="mp4-720"  style={{ background: 'var(--bg-color-mid)' }}>MP4 720p (Balanced)</option>
              <option value="mp4-480"  style={{ background: 'var(--bg-color-mid)' }}>MP4 480p (Fast)</option>
              <option value="mp3-audio" style={{ background: 'var(--bg-color-mid)' }}>MP3 Audio Only</option>
              <option value="webm-720" style={{ background: 'var(--bg-color-mid)' }}>WEBM 720p</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          </div>
        </div>

        {/* Toggle rows */}
        {settingRows.map(({ key, icon: Icon, iconColor, iconBg, label, desc }) => (
          <div
            key={key}
            className="glass-card !rounded-2xl sm:!rounded-[32px] flex items-center justify-between gap-4"
            style={{ cursor: 'default' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{label}</h3>
                <p className="text-xs opacity-60 mt-0.5 leading-snug" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
              </div>
            </div>
            <ToggleSwitch enabled={settings[key]} onChange={(v) => update(key, v)} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
