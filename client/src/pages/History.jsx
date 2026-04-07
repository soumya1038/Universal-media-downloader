import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Library, Info, Compass, Music, Download, AlertTriangle, Calendar, Smartphone, Video, Loader2, X } from 'lucide-react';
import { useHistory, useDeleteHistory, useClearHistory } from '../hooks/useHistory';

const statusColors = {
  queued: { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' },
  processing: { bg: 'rgba(0,212,255,0.15)', color: 'var(--color-accent)' },
  converting: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
  completed: { bg: 'rgba(34,197,94,0.15)', color: 'var(--color-success)' },
  failed: { bg: 'rgba(239,68,68,0.15)', color: 'var(--color-error)' },
};

export default function History() {
  const { data, isLoading, error } = useHistory();
  const deleteMutation = useDeleteHistory();
  const clearMutation = useClearHistory();

  const jobs = data?.data || [];

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this file from history? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL history? This will remove all downloaded files.')) {
      clearMutation.mutate();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container-app py-16 md:py-24"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black mb-4 tracking-widest uppercase"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-glass-border)', color: 'var(--color-accent)' }}>
            <Library size={14} />
            Media Storage
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter mb-2">Your Library</h1>
          <p className="text-base font-medium opacity-60 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
            Seamlessly access and manage your downloaded content with organic organization.
          </p>
        </div>

        <AnimatePresence>
          {jobs.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearAll}
              disabled={clearMutation.isPending}
              className="flex items-center gap-2 px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all focus:outline-none border-none cursor-pointer shadow-lg"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-error)',
              }}
            >
              <Trash2 size={16} strokeWidth={3} />
              Clear Everything
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card !p-0 overflow-hidden rounded-2xl flex flex-col h-72">
              <div className="skeleton h-40 w-full" />
              <div className="p-5 flex-1 space-y-3">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card text-center py-12 flex flex-col items-center border-red-500/20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Connection Failed</p>
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>Unable to load your download history. Please try again later.</p>
        </div>
      )}

      {!isLoading && jobs.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-20 flex flex-col items-center border-dashed"
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--color-surface)' }}>
            <Compass size={48} className="text-muted-foreground opacity-30" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Your library is empty</h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
            Start downloading your favorite media content. They will automatically show up here, perfectly organized and ready to play.
          </p>
          <Link to="/" className="btn-primary mt-8 no-underline font-bold">
            <Download size={18} />
            Browse Features
          </Link>
        </motion.div>
      )}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {jobs.map((job, i) => {
            const sc = statusColors[job.status] || statusColors.queued;
            const isDeleting = deleteMutation.variables === job.id && deleteMutation.isPending;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -30, transition: { duration: 0.3 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 120, delay: i * 0.05 }}
                key={job.id}
                className="flex flex-col rounded-[48px] overflow-hidden glass-card !p-0 transition-all duration-700 relative group border border-white/5 hover:border-white/20 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] bg-[#0a0a0f]/40 backdrop-blur-2xl"
                style={{ 
                   opacity: isDeleting ? 0.5 : 1
                }}
              >
                {/* Visual Status Bar (Left) */}
                <div className="absolute top-0 left-0 w-2 h-full z-20 transition-all group-hover:w-3" style={{ background: sc.color }} />


                {/* Premium Aspect Ratio Thumbnail */}
                <div className="aspect-video w-full relative bg-gray-950/40 border-b border-white/5 overflow-hidden">
                  {job.thumbnail ? (
                    <>
                      <img 
                        src={job.thumbnail} 
                        alt="thumbnail" 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                      />
                      {/* Artistic Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent mix-blend-multiply" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                       <Music size={48} className="opacity-10 text-white animate-pulse" />
                    </div>
                  )}
                  
                  {/* Status Pod Overlaid */}
                  <div className="absolute top-6 right-6">
                    <motion.div 
                      layoutId={`status-${job.id}`}
                      className="text-[9px] px-4 py-2 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-3xl border border-white/10 flex items-center gap-2" 
                      style={{ background: `${sc.color}15`, color: sc.color }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'processing' ? 'animate-ping' : ''}`} style={{ background: sc.color }} />
                      {job.status === 'processing' ? `${job.progress}%` : job.status}
                    </motion.div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-8 pb-10 flex-1 flex flex-col relative overflow-hidden">
                   {/* Decorative background pod */}
                   <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[80px] opacity-10" style={{ background: sc.color }} />

                   {/* Meta pods */}
                   <div className="flex flex-wrap gap-2 mb-6">
                    <span className="flex items-center gap-2 text-[8px] uppercase font-black tracking-[0.15em] px-4 py-2 rounded-full bg-white/5 text-gray-400 border border-white/5 backdrop-blur-md">
                      <Smartphone size={12} className="opacity-50" />
                      {job.platform}
                    </span>
                    <span className="flex items-center gap-2 text-[8px] uppercase font-black tracking-[0.15em] px-4 py-2 rounded-full backdrop-blur-md" 
                          style={{ background: 'rgba(255, 126, 103, 0.08)', color: 'var(--color-accent)', border: '1px solid rgba(255, 126, 103, 0.15)' }}>
                      {job.format === 'video' ? <Video size={12} className="opacity-70" /> : <Music size={12} className="opacity-70" />}
                      {job.format} • {job.quality !== 'audio' ? job.quality : 'HQ'}
                    </span>
                  </div>

                  <h3 
                    className="text-xl font-display font-black line-clamp-2 leading-[1.1] mb-8 flex-1 tracking-tight group-hover:text-accent transition-colors duration-500" 
                    style={{ color: 'var(--color-text-primary)' }}
                    title={job.title}
                  >
                    {job.title || 'Untitled Masterpiece'}
                  </h3>

                  <div className="flex items-center gap-3 text-[9px] font-black tracking-[0.2em] uppercase opacity-30 mb-8" style={{ color: 'var(--color-text-muted)' }}>
                    <Calendar size={14} className="opacity-50" />
                    <span>{new Date(job.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <div className="mt-auto pt-8 flex items-center gap-4">
                    {/* Unified Delete Pod */}
                    <motion.button
                      whileHover={{ scale: 1.1, background: 'rgba(239, 68, 68, 0.15)', y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(job.id)}
                      disabled={isDeleting}
                      className="w-14 h-14 rounded-[24px] border border-white/5 transition-all flex items-center justify-center cursor-pointer text-gray-500 hover:text-red-400 hover:border-red-500/40 bg-white/5 shadow-xl hover:shadow-red-500/10"
                      title="Purge from vault"
                    >
                      {isDeleting ? <Loader2 size={24} className="animate-spin" /> : <Trash2 size={22} strokeWidth={2.5} />}
                    </motion.button>

                    {/* Premium Save Action */}
                    {job.status === 'completed' && job.downloadUrl ? (
                      <motion.a 
                        href={job.downloadUrl} 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 h-14 text-center text-[10px] font-black uppercase tracking-[0.3em] rounded-[24px] no-underline flex items-center justify-center gap-3 shadow-2xl shadow-accent/30 text-[#0a0a0f] border border-accent/20 transition-all duration-300"
                        style={{ background: 'linear-gradient(135deg, var(--color-accent), #FF9B8A)' }}
                        download
                      >
                        <Download size={18} strokeWidth={3} />
                        Export Media
                      </motion.a>
                    ) : (
                      <div className="flex-1 h-14 rounded-[24px] bg-white/5 border border-white/5 text-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center justify-center gap-3 transition-opacity">
                        {job.status === 'failed' ? (
                          <>
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                             Unavailable
                          </>
                        ) : (
                          <>
                             <Loader2 size={16} className="animate-spin opacity-50" />
                             Vaulting...
                          </>
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
