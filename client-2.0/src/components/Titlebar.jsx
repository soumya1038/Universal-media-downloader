import React, { useState, useEffect } from 'react';

export default function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);

  useEffect(() => {
    if (!isElectron) return;
    const checkMax = async () => {
      if (window.electronAPI?.isMaximized) {
        const max = await window.electronAPI.isMaximized();
        setIsMaximized(max);
      }
    };
    checkMax();
  }, [isElectron]);

  if (!isElectron) return null;

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = async () => {
    await window.electronAPI?.maximizeWindow();
    const max = await window.electronAPI?.isMaximized();
    setIsMaximized(max);
  };
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <header
      className="h-8 flex items-center justify-between px-3 select-none z-50 sticky top-0"
      style={{
        background: 'var(--surface-container)',
        borderBottom: '1px solid var(--outline-variant)',
        WebkitAppRegion: 'drag',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>
          cloud_download
        </span>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--on-surface)' }}>
          Universal Media Downloader
        </span>
      </div>

      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          type="button"
          onClick={handleMinimize}
          className="w-9 h-8 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
          style={{ color: 'var(--on-surface-variant)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-container-high)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title="Minimize"
        >
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-9 h-8 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
          style={{ color: 'var(--on-surface-variant)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-container-high)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <span className="material-symbols-outlined text-sm">
            {isMaximized ? 'filter_none' : 'crop_square'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-9 h-8 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
          style={{ color: 'var(--on-surface-variant)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
          title="Close"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </header>
  );
}
