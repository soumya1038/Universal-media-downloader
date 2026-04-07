import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Layers, Trash2, Moon, Cpu, Layout, Check, ChevronDown } from 'lucide-react';

const DEFAULT_SETTINGS = {
  defaultFormat: 'mp4-720',
  autoDelete: true,
  darkMode: true,
  disableBackground: false,
};

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
    if (onBackgroundToggle) {
      onBackgroundToggle(settings.disableBackground);
    }
  }, [settings, onBackgroundToggle]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const ToggleSwitch = ({ enabled, onChange, id }) => (
    <button
      id={id}
      onClick={() => onChange(!enabled)}
      className="relative w-12 h-6 rounded-full transition-all duration-300 border-none cursor-pointer shrink-0"
      style={{
        background: enabled ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
      }}
    >
      <motion.span
        layout
        className="absolute top-0.5 w-5 h-5 rounded-full"
        style={{
          left: enabled ? '26px' : '2px',
          background: enabled ? '#0a0a1a' : 'var(--color-text-muted)',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container-app py-16 md:py-24 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon size={32} className="text-accent" style={{ color: 'var(--color-accent)' }} />
        <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="glass-card !rounded-[32px] overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-blue-400" />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Default Download Format
            </h3>
          </div>
          <div className="relative">
            <select
              id="default-format-select"
              value={settings.defaultFormat}
              onChange={(e) => updateSetting('defaultFormat', e.target.value)}
              className="glass-input cursor-pointer pr-10 appearance-none"
            >
              <option value="mp4-1080" style={{ background: 'var(--bg-color-mid)' }}>MP4 1080p (High Quality)</option>
              <option value="mp4-720" style={{ background: 'var(--bg-color-mid)' }}>MP4 720p (Balanced)</option>
              <option value="mp4-480" style={{ background: 'var(--bg-color-mid)' }}>MP4 480p (Fast)</option>
              <option value="mp3-audio" style={{ background: 'var(--bg-color-mid)' }}>MP3 Audio Only</option>
              <option value="webm-720" style={{ background: 'var(--bg-color-mid)' }}>WEBM 720p</option>
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          </div>
        </div>

        <div className="glass-card !rounded-[32px] flex items-center justify-between group transition-all hover:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center shrink-0">
               <Trash2 size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Auto Delete Completed Files
              </h3>
              <p className="text-xs font-medium opacity-60" style={{ color: 'var(--color-text-muted)' }}>
                Automatically remove local records after 24 hours.
              </p>
            </div>
          </div>
          <ToggleSwitch enabled={settings.autoDelete} onChange={(v) => updateSetting('autoDelete', v)} id="toggle-auto-delete" />
        </div>

        <div className="glass-card !rounded-[32px] flex items-center justify-between group transition-all hover:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center shrink-0">
               <Moon size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Dark Mode
              </h3>
              <p className="text-xs font-medium opacity-60" style={{ color: 'var(--color-text-muted)' }}>
                Use premium dark theme interface.
              </p>
            </div>
          </div>
          <ToggleSwitch enabled={settings.darkMode} onChange={(v) => updateSetting('darkMode', v)} id="toggle-dark-mode" />
        </div>

        <div className="glass-card !rounded-[32px] flex items-center justify-between group transition-all hover:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center shrink-0">
               <Cpu size={20} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Disable Animated Background
              </h3>
              <p className="text-xs font-medium opacity-60" style={{ color: 'var(--color-text-muted)' }}>
                Turn off the 3D scene for better performance on older devices.
              </p>
            </div>
          </div>
          <ToggleSwitch enabled={settings.disableBackground} onChange={(v) => updateSetting('disableBackground', v)} id="toggle-background" />
        </div>
      </div>
    </motion.div>
  );
}
