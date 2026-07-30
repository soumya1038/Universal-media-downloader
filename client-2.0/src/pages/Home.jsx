import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalyze } from '../hooks/useAnalyze';
import { useDownload } from '../hooks/useDownload';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/* ── 360° Radial Download Ring ── */
function DownloadRing({ progress = 0, speed, eta, size = 110, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.min(100, Math.max(0, progress || 0));
  const offset = circumference - (safe / 100) * circumference;
  const cleanSpeed = speed ? speed.split('at')[0].trim() : null;

  return (
    <div className="flex flex-col items-center gap-2 shrink-0 my-auto">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background track */}
        <svg className="w-full h-full absolute" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius}
            stroke="var(--surface-container-highest)" strokeWidth={strokeWidth} fill="transparent" />
        </svg>
        {/* Progress arc */}
        <svg className="w-full h-full absolute" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius}
            stroke="var(--primary)" strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center text-center px-1">
          <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--primary)' }}>
            {Math.round(safe)}%
          </span>
          {cleanSpeed && (
            <span className="text-[10px] font-bold tracking-tight mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              {cleanSpeed}
            </span>
          )}
        </div>
      </div>
      {eta && (
        <span className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined text-sm">schedule</span>
          {eta}
        </span>
      )}
    </div>
  );
}

export default function Home({
  addToast,
  singleCards = [],
  setSingleCards = () => {},
  batchItems = [],
  setBatchItems = () => {},
}) {
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkUrlInput, setBulkUrlInput] = useState('');

  const analyzeMutation = useAnalyze();
  const downloadMutation = useDownload();

  /* ── Analyze Single URL ── */
  const handleAnalyzeSingle = () => {
    if (!singleUrl.trim()) return;
    const urlToAnalyze = singleUrl.trim();

    const tempId = `card-analyzing-${Date.now()}`;
    const loadingCard = {
      id: tempId, url: urlToAnalyze, isAnalyzing: true,
      metadata: { title: 'Analyzing Media Link...', thumbnail: null, platform: 'Fetching video options...' },
      selectedFormat: null, jobId: null, jobStatus: null, progress: 0,
      speed: null, eta: null, downloadUrl: null, fileSize: null, error: null,
    };

    setSingleCards(prev => [loadingCard, ...prev.filter(c => c.url !== urlToAnalyze)]);
    setSingleUrl('');

    analyzeMutation.mutate(urlToAnalyze, {
      onSuccess: (res) => {
        if (res.success) {
          setSingleCards(prev => prev.map(c => {
            if (c.id === tempId || c.url === urlToAnalyze) {
              return {
                id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                url: urlToAnalyze, isAnalyzing: false,
                metadata: res.data,
                selectedFormat: res.data.downloadOptions?.[0] || null,
                jobId: null, jobStatus: null, progress: 0,
                speed: null, eta: null, downloadUrl: null, fileSize: null, error: null,
              };
            }
            return c;
          }));
          if (addToast) addToast("Media analyzed successfully", "success");
        } else {
          setSingleCards(prev => prev.filter(c => c.id !== tempId));
          if (addToast) addToast(res.error || "Failed to analyze URL", "error");
        }
      },
      onError: (err) => {
        setSingleCards(prev => prev.filter(c => c.id !== tempId));
        if (addToast) addToast(err.message || "Failed to analyze URL", "error");
      }
    });
  };

  /* ── Start Download ── */
  const handleStartCardDownload = (cardId) => {
    const card = singleCards.find(c => c.id === cardId);
    if (!card || !card.selectedFormat || !card.metadata) return;

    downloadMutation.mutate({
      url: card.url,
      format: card.selectedFormat.format,
      quality: card.selectedFormat.quality,
      formatId: card.selectedFormat.formatId,
      downloadMethod: card.selectedFormat.downloadMethod || card.metadata.checks?.method,
      title: card.metadata.title,
      thumbnail: card.metadata.thumbnail,
      platform: card.metadata.platform,
      author: card.metadata.author,
      duration: card.metadata.duration,
    }, {
      onSuccess: (res) => {
        if (res.success) {
          const jobId = res.data.jobId;
          setSingleCards(prev => prev.map(c =>
            c.id === cardId ? { ...c, jobId, jobStatus: 'queued', progress: 0, speed: '0 KB/s' } : c
          ));
          if (addToast) addToast(`Started download: ${card.metadata.title}`, "success");
        }
      }
    });
  };

  /* ── Cancel Download ── */
  const handleCancelCardDownload = async (cardId) => {
    const card = singleCards.find(c => c.id === cardId);
    if (!card) return;
    if (card.jobId) {
      try { await fetch(`/api/cancel/${card.jobId}`, { method: 'DELETE' }); } catch (e) {}
    }
    setSingleCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, jobId: null, jobStatus: null, progress: 0, speed: null, eta: null, downloadUrl: null, error: null } : c
    ));
    if (addToast) addToast("Download cancelled", "info");
  };

  /* ── Remove Card ── */
  const handleRemoveCard = (cardId) => {
    const card = singleCards.find(c => c.id === cardId);
    if (card && card.jobId) {
      fetch(`/api/cancel/${card.jobId}`, { method: 'DELETE' }).catch(() => {});
    }
    setSingleCards(prev => prev.filter(c => c.id !== cardId));
  };

  /* ── Re-Download (reset card to format selection) ── */
  const handleReDownload = (cardId) => {
    const card = singleCards.find(c => c.id === cardId);
    if (!card) return;
    setSingleCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, jobId: null, jobStatus: null, progress: 0, speed: null, eta: null, downloadUrl: null, fileSize: null, error: null } : c
    ));
    if (addToast) addToast("Select a new format to re-download", "info");
  };

  /* ── Save File & Auto-Dismiss from Home ── */
  const handleSaveFile = (card) => {
    if (!card.downloadUrl) return;
    // Trigger browser download
    const a = document.createElement('a');
    a.href = card.downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (addToast) addToast("File saved! Card moved to History", "success");
    // Auto-dismiss after short delay
    setTimeout(() => {
      setSingleCards(prev => prev.filter(c => c.id !== card.id));
    }, 1500);
  };

  /* ── Copy URL helper ── */
  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => { if (addToast) addToast("URL copied to clipboard", "success"); })
      .catch(() => {});
  };

  /* ── Batch Analyze ── */
  const handleAnalyzeBatch = () => {
    const urls = bulkUrlInput.split(/\r?\n|,/).map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) return;

    const newItems = urls.map(url => ({ url, status: 'analyzing', metadata: null, error: null }));
    setBatchItems(newItems);

    newItems.forEach((item, index) => {
      analyzeMutation.mutate(item.url, {
        onSuccess: (response) => {
          setBatchItems(prev => {
            const copy = [...prev];
            if (response.success) {
              copy[index] = { ...copy[index], status: 'resolved', metadata: response.data, selectedFormat: response.data.downloadOptions?.[0] };
            } else {
              copy[index] = { ...copy[index], status: 'failed', error: 'Extraction failed' };
            }
            return copy;
          });
        },
        onError: (err) => {
          setBatchItems(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], status: 'failed', error: err.message };
            return copy;
          });
        }
      });
    });
  };

  const handleStartBatchItemDownload = (item) => {
    const meta = item.metadata;
    if (!meta) return;
    const opt = item.selectedFormat || (meta.downloadOptions?.[0]) || { format: 'mp4', quality: '720p', id: 'default-720' };

    downloadMutation.mutate({
      url: item.url, format: opt.format, quality: opt.quality, formatId: opt.formatId,
      downloadMethod: opt.downloadMethod || meta.checks?.method,
      title: meta.title, thumbnail: meta.thumbnail, platform: meta.platform,
      author: meta.author, duration: meta.duration,
    }, {
      onSuccess: (res) => {
        if (res.success) {
          setBatchItems(prev => prev.map(b =>
            b.url === item.url ? { ...b, status: 'downloading', jobId: res.data.jobId } : b
          ));
          if (addToast) addToast(`Started: ${meta.title}`, "success");
        }
      }
    });
  };

  const handleDownloadAllBatch = () => {
    batchItems.forEach((item) => { if (item.status === 'resolved') handleStartBatchItemDownload(item); });
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>Download</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Paste a video or audio link to get started</p>
      </div>

      {/* URL Input Card */}
      <div className="glass-card p-5 space-y-4">
        {/* Mode Tabs */}
        <div className="inline-flex rounded-lg p-1 gap-0.5" style={{ background: 'var(--surface-container-high)' }}>
          {[{ key: false, label: 'Single URL', icon: 'link' }, { key: true, label: 'Batch', icon: 'playlist_add' }].map(tab => (
            <button
              key={String(tab.key)}
              type="button"
              onClick={() => setIsBulkMode(tab.key)}
              className="px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all border-none flex items-center gap-1.5"
              style={{
                background: isBulkMode === tab.key ? 'var(--surface-container)' : 'transparent',
                color: isBulkMode === tab.key ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                boxShadow: isBulkMode === tab.key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input */}
        {!isBulkMode ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg pointer-events-none" style={{ color: 'var(--on-surface-variant)' }}>link</span>
              <input
                type="url"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="Paste video or audio URL..."
                className="input-field w-full text-xs"
                style={{ paddingLeft: '42px', paddingRight: '88px' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyzeSingle(); }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {singleUrl ? (
                  <button type="button" onClick={() => setSingleUrl('')} className="btn-icon" title="Clear">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard?.readText().then(t => { if (t) setSingleUrl(t.trim()); }).catch(() => {}); }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border-none cursor-pointer transition-all flex items-center gap-1"
                    style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}
                    title="Paste from clipboard"
                  >
                    <span className="material-symbols-outlined text-sm">content_paste</span>
                    Paste
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAnalyzeSingle}
              disabled={analyzeMutation.isPending || !singleUrl.trim()}
              className="btn-primary shrink-0"
            >
              {analyzeMutation.isPending ? (
                <><span className="material-symbols-outlined animate-spin text-base">sync</span> Analyzing...</>
              ) : (
                <><span className="material-symbols-outlined text-base">search</span> Analyze</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows="4"
              value={bulkUrlInput}
              onChange={(e) => setBulkUrlInput(e.target.value)}
              placeholder="Paste multiple URLs (one per line)..."
              className="input-field w-full font-mono text-xs"
              style={{ resize: 'vertical' }}
            />
            <button
              type="button"
              onClick={handleAnalyzeBatch}
              disabled={analyzeMutation.isPending || !bulkUrlInput.trim()}
              className="btn-primary"
            >
              <span className="material-symbols-outlined text-base">playlist_add_check</span>
              Analyze All
            </button>
          </div>
        )}
      </div>

      {/* ─── Media Cards (Full Width) ─── */}
      <div className="space-y-4">

        {/* Single URL Cards */}
        {!isBulkMode && singleCards.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence>
              {singleCards.map((card) => {
                const meta = card.metadata;
                const isDownloading = card.jobId && ['queued', 'processing'].includes(card.jobStatus);
                const isDone = card.jobStatus === 'completed';
                const isFailed = card.jobStatus === 'failed';

                /* ── Analyzing Skeleton ── */
                if (card.isAnalyzing) {
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="glass-card p-5 relative overflow-hidden"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-36 aspect-video rounded-xl shrink-0 flex items-center justify-center animate-pulse"
                          style={{ background: 'var(--surface-container-high)' }}>
                          <span className="material-symbols-outlined text-2xl animate-spin" style={{ color: 'var(--primary)' }}>progress_activity</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
                          <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--surface-container-high)' }} />
                          <div className="flex items-center gap-2 pt-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                            Analyzing media formats & extracting available qualities...
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveCard(card.id)} className="btn-icon absolute top-3 right-3" title="Cancel">
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                /* ── Normal Card ── */
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="glass-card p-5 space-y-4 relative"
                  >
                    {/* Header: Thumbnail + Info + Actions */}
                    <div className="flex gap-4 items-start relative pr-20">
                      {/* Thumbnail */}
                      <div className="w-36 aspect-video rounded-xl overflow-hidden shrink-0 relative"
                        style={{ background: 'var(--surface-container-high)' }}>
                        <img src={meta.thumbnail} alt={meta.title} className="w-full h-full object-cover" />
                        {meta.duration && (
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/75 text-white">
                            {meta.duration}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h2 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--on-surface)' }}>{meta.title}</h2>
                        <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--on-surface-variant)' }}>
                          {meta.author && <span>{meta.author}</span>}
                          <span className="badge badge-neutral capitalize">{meta.platform || 'Web'}</span>
                        </div>
                        {card.selectedFormat && (isDownloading || isDone) && (
                          <span className="badge badge-primary text-[10px] mt-1">
                            {card.selectedFormat.quality} • {card.selectedFormat.format?.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Header Actions: Copy URL & Remove */}
                      <div className="absolute top-0 right-0 flex items-center gap-1">
                        <button type="button" onClick={() => handleCopyUrl(card.url)} className="btn-icon" title="Copy original URL">
                          <span className="material-symbols-outlined text-base">content_copy</span>
                        </button>
                        <button type="button" onClick={() => handleRemoveCard(card.id)} className="btn-icon" title="Remove">
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    </div>

                    {/* ── State: Format Selection ── */}
                    {!isDownloading && !isDone && !isFailed && (
                      <div className="space-y-3 pt-3" style={{ borderTop: '1px solid var(--outline-variant)' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>
                          Select Format
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(meta.downloadOptions || []).map((opt) => {
                            const isSelected = card.selectedFormat?.id === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSingleCards(prev => prev.map(c => c.id === card.id ? { ...c, selectedFormat: opt } : c))}
                                className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all border"
                                style={{
                                  background: isSelected ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'var(--surface-container)',
                                  borderColor: isSelected ? 'var(--primary)' : 'var(--outline)',
                                  color: isSelected ? 'var(--primary)' : 'var(--on-surface)',
                                }}
                              >
                                <span className="font-semibold">{opt.quality}</span>
                                <span className="ml-1.5 opacity-60">{opt.format} • {formatBytes(opt.estimatedStorageBytes || opt.filesize)}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartCardDownload(card.id)}
                          disabled={!card.selectedFormat}
                          className="btn-primary w-full"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                          Start Download
                        </button>
                      </div>
                    )}

                    {/* ── State: Downloading (Prominent Full-Height Circular Radial Progress Screen) ── */}
                    {isDownloading && (
                      <div className="flex flex-col sm:flex-row items-stretch justify-between gap-6 pt-4 pb-4 px-6 rounded-2xl"
                        style={{ background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}
                      >
                        {/* Left Info & Status */}
                        <div className="flex-1 space-y-3 flex flex-col justify-between py-1">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="badge badge-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 py-1 px-2.5">
                                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                {card.jobStatus || 'Downloading'}
                              </span>
                              {card.selectedFormat && (
                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ background: 'var(--surface-container-highest)', color: 'var(--on-surface)' }}>
                                  {card.selectedFormat.quality} • {card.selectedFormat.format?.toUpperCase()}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[var(--on-surface-variant)] font-medium leading-relaxed">
                              Extracting and downloading media stream directly to storage...
                            </p>
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => handleCancelCardDownload(card.id)}
                              className="text-xs font-semibold px-4 py-2.5 rounded-xl border-none cursor-pointer transition-all inline-flex items-center gap-2"
                              style={{ background: 'color-mix(in srgb, var(--error) 12%, transparent)', color: 'var(--error)' }}
                            >
                              <span className="material-symbols-outlined text-base">cancel</span>
                              Cancel Download
                            </button>
                          </div>
                        </div>

                        {/* Right: Prominent Full-Height Circular Progress Screen */}
                        <div className="flex flex-col items-center justify-center p-5 rounded-2xl shrink-0 min-w-[160px] self-stretch"
                          style={{ background: 'var(--surface-container)', border: '1px solid var(--outline)' }}
                        >
                          <DownloadRing progress={card.progress} speed={card.speed} eta={card.eta} size={110} strokeWidth={8} />
                        </div>
                      </div>
                    )}

                    {/* ── State: Completed ── */}
                    {isDone && (
                      <div className="flex items-center justify-between gap-3 pt-3 p-4 rounded-xl" style={{ background: 'var(--success-soft)', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--success)' }}>
                          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Download Complete {(card.fileSize || card.file_size) ? `(${formatBytes(card.fileSize || card.file_size)})` : ''}
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleReDownload(card.id)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all flex items-center gap-1.5"
                            style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}
                          >
                            <span className="material-symbols-outlined text-sm">restart_alt</span>
                            Re-Download
                          </button>
                          {card.downloadUrl && (
                            <button type="button" onClick={() => handleSaveFile(card)}
                              className="px-4 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                              style={{ background: 'var(--success)', color: '#fff' }}
                            >
                              <span className="material-symbols-outlined text-sm">download</span>
                              Save File
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── State: Failed ── */}
                    {isFailed && (
                      <div className="flex items-center justify-between gap-3 pt-3 p-4 rounded-xl" style={{ background: 'var(--error-soft)', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}>
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--error)' }}>
                          <span className="material-symbols-outlined text-lg">error</span>
                          Download failed
                        </div>
                        <button type="button" onClick={() => handleCancelCardDownload(card.id)} className="btn-ghost text-xs">
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          Retry
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Batch Results */}
        {isBulkMode && batchItems.length > 0 && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>Batch Items ({batchItems.length})</h3>
              <button type="button" onClick={handleDownloadAllBatch} className="btn-primary text-xs py-2 px-4">
                <span className="material-symbols-outlined text-sm">download_for_offline</span>
                Download All
              </button>
            </div>

            <div className="space-y-2">
              {batchItems.map((item, index) => {
                const meta = item.metadata;
                const isResolved = item.status === 'resolved';
                const isAnalyzing = item.status === 'analyzing';
                const isFailed = item.status === 'failed';

                return (
                  <div key={index} className="p-3 rounded-xl flex items-center gap-3 transition-all"
                    style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}>
                    {/* Thumbnail */}
                    <div className="w-24 aspect-video rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: 'var(--surface-container-high)' }}>
                      {meta?.thumbnail ? (
                        <img src={meta.thumbnail} alt={meta.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-lg" style={{ color: 'var(--on-surface-variant)' }}>
                          {isAnalyzing ? 'sync' : 'movie'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
                        {meta?.title || item.url}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] flex-wrap">
                        {meta?.author && <span style={{ color: 'var(--on-surface-variant)' }}>{meta.author}</span>}
                        {isAnalyzing && <span className="badge badge-primary">Analyzing...</span>}
                        {isFailed && <span className="badge badge-error">{item.error || 'Failed'}</span>}
                        {isResolved && meta?.downloadOptions && (
                          <select
                            value={item.selectedFormat?.id || meta.downloadOptions[0]?.id}
                            onChange={(e) => {
                              const found = meta.downloadOptions.find(o => o.id === e.target.value);
                              if (found) {
                                setBatchItems(prev => { const copy = [...prev]; copy[index] = { ...copy[index], selectedFormat: found }; return copy; });
                              }
                            }}
                            className="input-field py-1 px-2 text-[11px] max-w-[200px]"
                          >
                            {meta.downloadOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label || opt.quality} ({formatBytes(opt.estimatedStorageBytes || opt.filesize)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Copy URL & Action */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => handleCopyUrl(item.url)} className="btn-icon" title="Copy original URL">
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                      {isResolved && (
                        <button type="button" onClick={() => handleStartBatchItemDownload(item)} className="btn-primary text-xs py-2 px-3">
                          <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
