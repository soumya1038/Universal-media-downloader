import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistory, useDeleteHistory, useClearHistory } from '../hooks/useHistory';
import ConfirmModal from '../components/ConfirmModal';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatusBadge({ status, error }) {
  const isCancelled = status === 'cancelled' || error?.toLowerCase().includes('cancel');
  if (isCancelled) {
    return <span className="badge badge-warning capitalize">Canceled</span>;
  }
  const map = {
    completed: { label: 'Completed', cls: 'badge-success' },
    failed: { label: 'Failed', cls: 'badge-error' },
    processing: { label: 'Processing', cls: 'badge-primary' },
    queued: { label: 'Queued', cls: 'badge-neutral' },
  };
  const info = map[status] || { label: status, cls: 'badge-neutral' };
  return <span className={`badge ${info.cls} capitalize`}>{info.label}</span>;
}

export default function History({ addToast, onRetryJob }) {
  const { data, isLoading } = useHistory();
  const deleteMutation = useDeleteHistory();
  const clearMutation = useClearHistory();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');
  const [previewJob, setPreviewJob] = useState(null);

  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => { if (addToast) addToast("URL copied to clipboard", "success"); })
      .catch(() => { if (addToast) addToast("Failed to copy URL", "error"); });
  };

  // In-App Confirm Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    isDanger: false,
    onConfirm: () => {},
  });

  const jobs = data?.data || [];

  const openDeleteConfirm = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Download Record',
      message: 'Are you sure you want to delete this record and its associated file?',
      isDanger: true,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        deleteMutation.mutate(id, {
          onSuccess: () => { if (addToast) addToast("Record deleted", "info"); }
        });
      }
    });
  };

  const openClearConfirm = () => {
    setModalConfig({
      isOpen: true,
      title: 'Clear All History',
      message: 'Are you sure you want to clear all download history records? Downloaded files will be removed.',
      isDanger: true,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        clearMutation.mutate(undefined, {
          onSuccess: () => { if (addToast) addToast("All history cleared", "info"); }
        });
      }
    });
  };

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        if (searchQuery.trim() && !job.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeFilter === 'video' && job.format === 'mp3') return false;
        if (activeFilter === 'audio' && job.format !== 'mp3') return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [jobs, activeFilter, searchQuery, sortBy]);

  return (
    <div className="w-full space-y-6">
      {/* In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>History</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>Manage your downloaded media</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="inline-flex rounded-lg p-1 gap-0.5" style={{ background: 'var(--surface-container-high)' }}>
            {['all', 'video', 'audio'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all border-none capitalize"
                style={{
                  background: activeFilter === f ? 'var(--surface-container)' : 'transparent',
                  color: activeFilter === f ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  boxShadow: activeFilter === f ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {f === 'all' ? 'All' : f === 'video' ? 'Videos' : 'Audio'}
              </button>
            ))}
          </div>

          {jobs.length > 0 && (
            <button type="button" onClick={openClearConfirm} className="btn-danger text-xs py-1.5 px-3">
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search & View Options */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none" style={{ color: 'var(--on-surface-variant)' }}>search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="input-field w-full text-xs"
            style={{ paddingLeft: '40px', paddingRight: '36px' }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="btn-icon absolute right-2 top-1/2 -translate-y-1/2">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none font-semibold cursor-pointer outline-none text-xs"
              style={{ color: 'var(--on-surface)' }}
            >
              <option value="date">Date</option>
              <option value="size">Size</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="flex items-center rounded-lg p-0.5" style={{ border: '1px solid var(--outline)', background: 'var(--surface-container)' }}>
            {['grid_view', 'view_list'].map((icon, i) => {
              const mode = i === 0 ? 'grid' : 'list';
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className="p-1.5 rounded border-none cursor-pointer transition-all"
                  style={{
                    background: viewMode === mode ? 'var(--surface-container-high)' : 'transparent',
                    color: viewMode === mode ? 'var(--primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  <span className="material-symbols-outlined text-base">{icon}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 space-y-3">
              <div className="skeleton aspect-video w-full rounded-lg" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredJobs.length === 0 && (
        <div className="glass-card p-16 text-center flex flex-col items-center max-w-sm mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined text-3xl">folder_off</span>
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--on-surface)' }}>No Downloads Found</h3>
            <p className="text-xs mt-1.5" style={{ color: 'var(--on-surface-variant)' }}>Downloaded media will appear here.</p>
          </div>
          <Link to="/" className="btn-primary text-xs no-underline">
            Start Downloading
          </Link>
        </div>
      )}

      {/* Download Items */}
      {!isLoading && filteredJobs.length > 0 && (
        <div className={viewMode === 'list' ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>
          {filteredJobs.map((job) => {
            const isDone = job.status === 'completed';
            const isProcessing = ['processing', 'queued'].includes(job.status);
            const isFailedOrCancelled = ['failed', 'cancelled'].includes(job.status);
            const cleanSpeed = job.speed ? job.speed.split('at')[0].trim() : null;

            return (
              <div
                key={job.id}
                className={`glass-card overflow-hidden transition-all flex ${
                  viewMode === 'list' ? 'flex-row items-center p-3 gap-4' : 'flex-col'
                }`}
                style={{ cursor: 'default' }}
              >
                {/* Thumbnail */}
                <div className={`relative overflow-hidden shrink-0 ${
                  viewMode === 'list' ? 'w-28 aspect-video rounded-lg' : 'w-full aspect-video'
                }`} style={{ background: 'var(--surface-container-high)' }}>
                  {job.thumbnail ? (
                    <img src={job.thumbnail} alt={job.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--on-surface-variant)' }}>
                      <span className="material-symbols-outlined text-2xl">movie</span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/70 text-white">
                    {job.quality || job.format || 'MP4'}
                  </span>
                </div>

                {/* Details */}
                <div className={`flex-1 min-w-0 space-y-2 ${viewMode === 'list' ? '' : 'p-4'}`}>
                  <h3 className="text-xs font-bold truncate" style={{ color: 'var(--on-surface)' }} title={job.title}>
                    {job.title || 'Untitled'}
                  </h3>

                  {/* Status & Size Row */}
                  <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={job.status} error={job.error} />
                      {(job.fileSize || job.file_size || job.size) ? (
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded-md" style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
                          {formatBytes(job.fileSize || job.file_size || job.size)}
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-medium text-[11px]">{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Processing Live Progress Bar */}
                  {isProcessing && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-semibold" style={{ color: 'var(--primary)' }}>
                        <span>{Math.round(job.progress || 0)}% {cleanSpeed ? `• ${cleanSpeed}` : ''}</span>
                        {job.eta && <span>ETA: {job.eta}</span>}
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-highest)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.max(5, job.progress || 0)}%`, background: 'var(--primary)', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {isDone && job.downloadUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewJob(job)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all flex items-center justify-center gap-1"
                          style={{
                            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                            color: 'var(--primary)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'var(--on-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        >
                          <span className="material-symbols-outlined text-sm">play_arrow</span>
                          Play
                        </button>
                        <a
                          href={job.downloadUrl}
                          download
                          className="py-1.5 px-3 rounded-lg text-xs font-semibold no-underline flex items-center justify-center transition-all"
                          style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}
                        >
                          Save
                        </a>
                        <button
                          type="button"
                          onClick={() => onRetryJob && onRetryJob(job)}
                          className="py-1.5 px-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all flex items-center justify-center gap-1"
                          style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)', color: 'var(--primary)' }}
                          title="Re-download with different quality"
                        >
                          <span className="material-symbols-outlined text-sm">restart_alt</span>
                        </button>
                      </>
                    ) : isFailedOrCancelled ? (
                      <button
                        type="button"
                        onClick={() => onRetryJob && onRetryJob(job)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all flex items-center justify-center gap-1"
                        style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }}
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Retry Options
                      </button>
                    ) : null}

                    {/* Copy Original URL Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(job.url)}
                      className="btn-icon"
                      title="Copy original URL"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(job.id)}
                      className="btn-icon"
                      title="Delete record"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewJob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setPreviewJob(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-2xl overflow-hidden"
              style={{ maxHeight: '85vh' }}
            >
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                <h3 className="text-sm font-bold truncate max-w-md" style={{ color: 'var(--on-surface)' }}>{previewJob.title}</h3>
                <button type="button" onClick={() => setPreviewJob(null)} className="btn-icon">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="flex items-center justify-center" style={{ background: '#000', minHeight: '260px' }}>
                {previewJob.format === 'mp3' ? (
                  <div className="py-10 flex flex-col items-center gap-4 w-full">
                    <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--primary)' }}>graphic_eq</span>
                    <audio controls src={previewJob.downloadUrl} className="w-4/5" autoPlay />
                  </div>
                ) : (
                  <video controls src={previewJob.downloadUrl} className="w-full" style={{ maxHeight: '60vh' }} autoPlay />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
