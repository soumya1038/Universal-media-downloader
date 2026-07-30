import React, { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  defaultFormat: 'mp4-1080',
  autoResume: true,
  darkMode: true,
  downloadPath: 'D:/Downloads/Media',
};

const DISK_TOTAL_GB = 250;
const DISK_AVAIL_GB = 42.6;

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
      role="switch"
      aria-checked={enabled}
      style={{ background: enabled ? 'var(--primary)' : 'var(--surface-container-highest)' }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200"
        style={{
          transform: enabled ? 'translateX(20px)' : 'translateX(0)',
          background: enabled ? '#fff' : 'var(--outline)',
        }}
      />
    </button>
  );
}

function SettingRow({ icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 gap-4" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="material-symbols-outlined text-lg mt-0.5 shrink-0" style={{ color: 'var(--on-surface-variant)' }}>{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{title}</p>
          {description && <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings({ theme, toggleTheme, addToast }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaDownloaderSettings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    if (theme && settings.darkMode !== (theme === 'dark')) {
      setSettings(prev => ({ ...prev, darkMode: theme === 'dark' }));
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mediaDownloaderSettings', JSON.stringify(settings));
  }, [settings]);

  const update = (key, value) => {
    if (key === 'darkMode') {
      if ((value && theme === 'light') || (!value && theme === 'dark')) {
        toggleTheme();
      }
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (addToast) addToast("Setting updated", "success");
  };

  const diskUsed = DISK_TOTAL_GB - DISK_AVAIL_GB;
  const diskPct = (diskUsed / DISK_TOTAL_GB) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Configure preferences and storage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Preferences */}
        <div className="lg:col-span-7 space-y-6">

          {/* Appearance */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--on-surface)' }}>
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--primary)' }}>palette</span>
              Appearance
            </h2>
            <SettingRow icon="dark_mode" title="Dark Mode" description="Toggle between dark and light interface">
              <Toggle enabled={settings.darkMode} onChange={(val) => update('darkMode', val)} />
            </SettingRow>
          </div>

          {/* Download Options */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--on-surface)' }}>
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--primary)' }}>downloading</span>
              Downloads
            </h2>

            <SettingRow icon="high_quality" title="Default Resolution" description="Preferred quality for new downloads">
              <select
                value={settings.defaultFormat}
                onChange={(e) => update('defaultFormat', e.target.value)}
                className="input-field text-xs py-2 px-3 cursor-pointer min-w-[160px]"
              >
                <option value="mp4-1080">Full HD (1080p)</option>
                <option value="mp4-720">HD (720p)</option>
                <option value="mp4-480">Standard (480p)</option>
                <option value="mp3-audio">Audio Only (MP3)</option>
              </select>
            </SettingRow>

            <SettingRow icon="folder" title="Download Path" description="Where files are saved">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.downloadPath}
                  onChange={(e) => update('downloadPath', e.target.value)}
                  className="input-field text-xs py-2 px-3 min-w-[180px]"
                />
                {typeof window !== 'undefined' && window.electronAPI?.selectFolder && (
                  <button
                    type="button"
                    onClick={async () => {
                      const path = await window.electronAPI.selectFolder();
                      if (path) update('downloadPath', path);
                    }}
                    className="btn-ghost text-xs py-2"
                  >
                    <span className="material-symbols-outlined text-sm">folder_open</span>
                    Browse
                  </button>
                )}
              </div>
            </SettingRow>

            <SettingRow icon="autorenew" title="Auto-Resume" description="Resume paused downloads on startup">
              <Toggle enabled={settings.autoResume} onChange={(val) => update('autoResume', val)} />
            </SettingRow>
          </div>
        </div>

        {/* Right: Storage */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--primary)' }}>hard_drive</span>
              Storage
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                <span>Disk Usage</span>
                <span>{diskUsed.toFixed(1)} GB / {DISK_TOTAL_GB} GB</span>
              </div>

              <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${diskPct}%`, background: diskPct > 90 ? 'var(--error)' : diskPct > 70 ? 'var(--warning)' : 'var(--primary)' }}
                />
                {diskPct > 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                    {diskPct.toFixed(0)}%
                  </span>
                )}
              </div>

              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                {DISK_AVAIL_GB.toFixed(1)} GB available for downloads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
