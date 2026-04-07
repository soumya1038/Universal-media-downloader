import React from 'react';
import { motion } from 'framer-motion';
import { Clock, DownloadCloud, Settings, CheckCircle, XCircle, FileDown, Loader2 } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return 'Unknown size';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const STEPS = [
  { key: 'queued', label: 'Queued', icon: Clock },
  { key: 'processing', label: 'Downloading', icon: DownloadCloud },
  { key: 'converting', label: 'Processing', icon: Settings },
  { key: 'completed', label: 'Ready', icon: CheckCircle },
];

export default function ProgressBar({ status, progress = 0, downloadUrl, error, onCancel, fileSize, format }) {
  const stepIndex = status === 'completed' ? 3
    : status === 'processing' && progress > 60 ? 2
    : status === 'processing' ? 1
    : 0;

  if (status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card flex items-center gap-4 border-red-500/20"
        style={{ background: 'rgba(239, 68, 68, 0.05)' }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/10 shrink-0">
          <XCircle size={24} className="text-red-500" />
        </div>
        <div>
          <p className="font-display font-bold text-base" style={{ color: 'var(--color-error)' }}>Download Failed</p>
          <p className="text-sm font-medium opacity-70" style={{ color: 'var(--color-text-muted)' }}>{error || 'An error occurred during process'}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
    >
      {/* Steps */}
      {/* Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex flex-col items-center gap-2 flex-1 relative">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${i <= stepIndex ? 'shadow-lg shadow-accent/20' : ''}`}
              style={{
                background: i <= stepIndex ? 'var(--color-accent)' : 'var(--color-surface)',
                border: `1px solid ${i <= stepIndex ? 'var(--color-accent)' : 'var(--color-glass-border)'}`,
                color: i <= stepIndex ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              <step.icon size={18} strokeWidth={i <= stepIndex ? 2.5 : 2} className={i === stepIndex && status !== 'completed' ? 'animate-pulse' : ''} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline"
              style={{ color: i <= stepIndex ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 z-[-1]" style={{
                background: i < stepIndex ? 'var(--color-accent)' : 'var(--color-glass-border)',
                opacity: i < stepIndex ? 0.5 : 0.2
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 rounded-full overflow-hidden mb-2 p-0.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-glass-border)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-dim))' }}
        >
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-full h-full"
            style={{ 
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              opacity: progress > 0 ? 1 : 0
            }}
          />
        </motion.div>
      </div>

      <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
        {progress}% complete
      </p>

      {/* Download link when ready */}
      {status === 'completed' && downloadUrl && (
        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          href={downloadUrl}
          className="btn-primary w-full mt-6 text-center no-underline flex flex-col items-center justify-center gap-1.5 py-4 px-6 group"
        >
          <div className="flex items-center gap-3">
             <FileDown size={24} className="group-hover:translate-y-0.5 transition-transform" />
             <span className="font-display font-bold text-lg uppercase tracking-tight">Save Media File</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold opacity-80 bg-black/10 px-3 py-1 rounded-full">
            <span>{format ? format.toUpperCase() : 'MP4'}</span>
            <div className="w-1 h-1 rounded-full bg-white/30" />
            <span>{formatBytes(fileSize)}</span>
          </div>
        </motion.a>
      )}
      {/* Cancel button while downloading */}
      {(status === 'queued' || status === 'processing' || status === 'converting') && onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border cursor-pointer flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
          style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--color-error)', backgroundColor: 'transparent' }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239,68,68,0.05)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <XCircle size={16} />
          Cancel Download
        </button>
      )}
    </motion.div>
  );
}
