import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Zap, ShieldCheck, Globe } from 'lucide-react';
import URLInput from '../components/URLInput';
import VideoPreview from '../components/VideoPreview';
import FormatSelector from '../components/FormatSelector';
import DownloadButton from '../components/DownloadButton';
import ProgressBar from '../components/ProgressBar';
import SkeletonCard from '../components/SkeletonCard';
import { useAnalyze } from '../hooks/useAnalyze';
import { useDownload } from '../hooks/useDownload';
import { useJobStatus } from '../hooks/useJobStatus';

export default function Home() {
  const [metadata, setMetadata] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [formatJobs, setFormatJobs] = useState({});
  const [inputUrl, setInputUrl] = useState('');

  const selectedFormatKey = selectedFormat ? `${selectedFormat.format}-${selectedFormat.quality}` : null;
  const currentJobId = selectedFormatKey ? formatJobs[selectedFormatKey] : null;

  const analyzeMutation = useAnalyze();
  const downloadMutation = useDownload();
  const { data: jobData } = useJobStatus(currentJobId);

  const handleAnalyze = (url) => {
    setInputUrl(url);
    setMetadata(null);
    setSelectedFormat(null);
    setFormatJobs({});

    analyzeMutation.mutate(url, {
      onSuccess: (response) => {
        if (response.success) {
          setMetadata(response.data);
        }
      },
    });
  };

  const handleDownload = () => {
    if (!selectedFormat || !inputUrl) return;

    downloadMutation.mutate(
      {
        url: inputUrl,
        format: selectedFormat.format,
        quality: selectedFormat.quality,
        formatId: selectedFormat.formatId,
        title: metadata?.title,
        thumbnail: metadata?.thumbnail,
        platform: metadata?.platform,
        author: metadata?.author,
        duration: metadata?.duration,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            setFormatJobs(prev => ({
              ...prev,
              [`${selectedFormat.format}-${selectedFormat.quality}`]: response.data.jobId
            }));
          }
        },
      }
    );
  };

  const handleReset = () => {
    setMetadata(null);
    setSelectedFormat(null);
    setFormatJobs({});
    setInputUrl('');
    analyzeMutation.reset();
    downloadMutation.reset();
  };

  const handleCancel = async () => {
    if (!currentJobId) return;
    try {
      await fetch(`/api/cancel/${currentJobId}`, { method: 'DELETE' });
      setFormatJobs(prev => {
        const newJobs = { ...prev };
        delete newJobs[selectedFormatKey];
        return newJobs;
      });
    } catch (e) {
      console.error('Failed to cancel job', e);
    }
  };

  useEffect(() => {
    const activeJobs = Object.values(formatJobs);
    if (activeJobs.length === 0) return;

    const handleBeforeUnload = () => {
      activeJobs.forEach(jobId => {
        navigator.sendBeacon(`/api/cancel/${jobId}`);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formatJobs]);

  const jobStatus = jobData?.data;
  const isFinished = jobStatus?.status === 'completed' || jobStatus?.status === 'failed';

  // Parse duration string like "3:32" or "1:02:45" to seconds
  const parseDuration = (dur) => {
    if (!dur) return null;
    const parts = dur.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container-app py-8 md:py-16 relative overflow-hidden"
    >
      {/* Organic Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] pointer-events-none z-[-1]"
        style={{ background: 'var(--color-accent)' }} />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px] pointer-events-none z-[-1]"
        style={{ background: 'var(--color-text-primary)' }} />

      <div className="flex flex-col items-center max-w-5xl mx-auto relative z-10 space-y-8 md:space-y-12">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 md:mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase mb-5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-glass-border)', color: 'var(--color-accent)' }}>
              <Zap size={14} strokeWidth={3} />
              Professional Media Tool
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-black leading-[0.85] tracking-tighter mb-5 md:mb-8">
              Universal Media<br />
              <span className="italic" style={{ color: 'var(--color-accent)' }}>Downloader</span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl opacity-70 max-w-2xl mx-auto leading-[1.4] font-medium mb-6 md:mb-10 px-2" style={{ color: 'var(--color-text-secondary)' }}>
              Save media from <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>YouTube</span>, <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Instagram</span>, and 40+ platforms instantly.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60">
                <ShieldCheck size={16} className="text-emerald-500" strokeWidth={3} />
                No Ads / No Malware
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-60">
                <Globe size={16} className="text-blue-500" strokeWidth={3} />
                All Formats Supported
              </div>
            </div>
          </motion.div>

          {/* URL Input */}
          <div className="w-full max-w-3xl">
            <URLInput onAnalyze={handleAnalyze} isLoading={analyzeMutation.isPending} />
          </div>

          {/* Error */}
          {analyzeMutation.isError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card w-full mb-6 p-4 flex items-center gap-3 border-red-500/20"
              style={{ background: 'rgba(239, 68, 68, 0.05)' }}
            >
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
                {analyzeMutation.error?.response?.data?.error || analyzeMutation.error?.message || 'Failed to analyze URL'}
              </p>
            </motion.div>
          )}

          {/* Loading Skeleton */}
          {analyzeMutation.isPending && (
            <div className="w-full mb-6">
              <SkeletonCard />
            </div>
          )}
        </div>

        {/* Right Column: Preview & Formats */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          {metadata && !analyzeMutation.isPending && (
            <motion.div layout className="w-full space-y-6">
              <VideoPreview metadata={metadata} />
              
              <div className="glass-card space-y-4">
                <FormatSelector selected={selectedFormat} onSelect={setSelectedFormat} availableFormats={metadata.formats} durationSeconds={metadata.durationSeconds || null} />

                {selectedFormat && !currentJobId && (
                  <DownloadButton
                    onClick={handleDownload}
                    disabled={!selectedFormat}
                    isLoading={downloadMutation.isPending}
                  />
                )}

                {currentJobId && jobStatus && (
                  <ProgressBar
                    status={jobStatus.status}
                    progress={jobStatus.progress}
                    downloadUrl={jobStatus.downloadUrl}
                    error={jobStatus.error}
                    onCancel={handleCancel}
                    fileSize={jobStatus.fileSize}
                    format={jobStatus.format}
                  />
                )}

                {/* New Download button */}
                {isFinished && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleReset}
                    className="btn-secondary w-full py-4 text-sm font-bold mt-4 flex items-center justify-center gap-2 group"
                  >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    Start New Download
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
