import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Library, Compass, Music, Download, AlertTriangle, Calendar, Smartphone, Video, Loader2 } from 'lucide-react';
import { useHistory, useDeleteHistory, useClearHistory } from '../hooks/useHistory';

const statusColors = {
  queued:     { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  processing: { bg: 'rgba(0,212,255,0.15)',   color: '#00d4ff' },
  converting: { bg: 'rgba(168,85,247,0.15)',  color: '#c084fc' },
  completed:  { bg: 'rgba(34,197,94,0.15)',   color: '#34d399' },
  failed:     { bg: 'rgba(239,68,68,0.15)',   color: '#fb7185' },
};

export default function History() {
  const { data, isLoading, error } = useHistory();
  const deleteMutation = useDeleteHistory();
  const clearMutation = useClearHistory();

  const jobs = data?.data || [];

  const handleDelete = (id) => {
    if (window.confirm('Delete this item from history?')) deleteMutation.mutate(id);
  };

  const handleClearAll = () => {
    if (window.confirm('Delete ALL history and downloaded files?')) clearMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container-app py-8 md:py-16"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-16">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black mb-3 tracking-widest uppercase"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-glass-border)', color: 'var(--color-accent)' }}>
            <Library size={12} />
            Media Storage
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter mb-1">Your Library</h1>
          <p className="text-sm font-medium opacity-60 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
            Access and manage your downloaded content.
          </p>
        </div>

        <AnimatePresence>
          {jobs.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearAll}
              disabled={clearMutation.isPending}
              className="flex items-center gap-2 px-5 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all cursor-pointer shrink-0"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#fb7185' }}
            >
              <Trash2 size={14} strokeWidth={3} />
              Clear All
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}>
              <div className="skeleton aspect-video w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card text-center py-10 flex flex-col items-center" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={28} className="text-red-500 mb-3" />
          <p className="font-bold mb-1">Connection Failed</p>
          <p className="text-sm opacity-60">Unable to load history. Please try again.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-16 flex flex-col items-center border-dashed"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'var(--color-surface)' }}>
            <Compass size={40} className="opacity-20" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <h2 className="text-xl font-display font-bold mb-2">Your library is empty</h2>
          <p className="text-sm max-w-xs opacity-60 mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Downloaded media will appear here, organized and ready to play.
          </p>
          <Link to="/" className="btn-primary no-underline font-bold text-sm flex items-center gap-2">
            <Download size={16} />
            Start Downloading
          </Link>
        </motion.div>
      )}

      {/* Cards grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {jobs.map((job, i) => {
            const sc = statusColors[job.status] || statusColors.queued;
            const isDeleting = deleteMutation.variables === job.id && deleteMutation.isPending;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 120, delay: i * 0.04 }}
                key={job.id}
                className="flex flex-col rounded-2xl overflow-hidden relative group"
                style={{
                  background: 'var(--color-glass)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid var(--color-glass-border)',
                  opacity: isDeleting ? 0.5 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                {/* Status bar (top) */}
                <div className="absolute top-0 left-0 right-0 h-0.5 z-10" style={{ background: sc.color }} />

                {/* Thumbnail */}
                <div className="aspect-video w-full relative overflow-hidden bg-gray-950/40">
                  {job.thumbnail ? (
                    <>
                      <img
                        src={job.thumbnail}
                        alt="thumbnail"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                      <Music size={36} className="opacity-10 text-white" />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <div className="text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                      <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'processing' ? 'animate-ping' : ''}`}
                        style={{ background: sc.color }} />
                      {job.status === 'processing' ? `${job.progress || 0}%` : job.status}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {/* Meta tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Smartphone size={10} />
                      {job.platform || 'unknown'}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,126,103,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(255,126,103,0.15)' }}>
                      {job.format === 'mp3' ? <Music size={10} /> : <Video size={10} />}
                      {job.format} {job.quality && job.quality !== 'audio' ? `• ${job.quality}` : ''}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold line-clamp-2 leading-snug flex-1"
                    style={{ color: 'var(--color-text-primary)' }}
                    title={job.title}>
                    {job.title || 'Untitled'}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-40"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <Calendar size={11} />
                    {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={isDeleting}
                      className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fb7185'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
                      title="Delete"
                    >
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>

                    {job.status === 'completed' && job.downloadUrl ? (
                      <a
                        href={job.downloadUrl}
                        className="flex-1 h-10 text-center text-[10px] font-black uppercase tracking-widest rounded-xl no-underline flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'linear-gradient(135deg, var(--color-accent), #FF9B8A)', color: '#0a0a0f' }}
                        download
                      >
                        <Download size={14} strokeWidth={3} />
                        Download
                      </a>
                    ) : (
                      <div className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#475569' }}>
                        {job.status === 'failed' ? (
                          <><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed</>
                        ) : (
                          <><Loader2 size={13} className="animate-spin opacity-50" /> Processing...</>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
