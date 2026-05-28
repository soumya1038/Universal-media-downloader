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

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown Size';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

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

  const executeDownload = (format, meta, url) => {
    if (!format || !url) return;
    
    setSelectedFormat(format);

    downloadMutation.mutate(
      {
        url: url,
        format: format.format,
        quality: format.quality,
        formatId: format.formatId,
        downloadMethod: format.downloadMethod || meta?.checks?.method,
        sourceUrl: format.sourceUrl || meta?.sourceUrl,
        title: meta?.title,
        thumbnail: meta?.thumbnail,
        platform: meta?.platform,
        author: meta?.author,
        duration: meta?.duration,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            setFormatJobs(prev => ({
              ...prev,
              [`${format.format}-${format.quality}`]: response.data.jobId
            }));
          }
        },
      }
    );
  };

  const handleAnalyze = (url) => {
    setInputUrl(url);
    setMetadata(null);
    setSelectedFormat(null);
    setFormatJobs({});

    analyzeMutation.mutate(url, {
      onSuccess: (response) => {
        if (response.success) {
          const data = response.data;
          setMetadata(data);
          
          if (!data.downloadBlocked) {
             let options = [];
             if (Array.isArray(data.downloadOptions) && data.downloadOptions.length > 0) {
                 options = data.downloadOptions;
             } else if (Array.isArray(data.formats)) {
                 const videoFormats = data.formats.filter(f => f.type === 'video');
                 if (videoFormats.length > 0) {
                     options = [{
                         id: `mp4-${videoFormats[0].resolution}`,
                         label: `MP4 ${videoFormats[0].resolution}`,
                         format: 'mp4',
                         quality: videoFormats[0].resolution,
                         type: 'video',
                         formatId: videoFormats[0].formatId,
                     }];
                 }
             }
             
             if (options.length > 0) {
                 setSelectedFormat(options[0]);
             }
          }
        }
      },
    });
  };

  const handleDownload = () => {
    executeDownload(selectedFormat, metadata, inputUrl);
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

  const isDownloadBlocked = Boolean(metadata?.downloadBlocked);
  const hasOptions = Array.isArray(metadata?.downloadOptions)
    ? metadata.downloadOptions.length > 0
    : Array.isArray(metadata?.formats) && metadata.formats.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container-app py-8 md:py-16 relative overflow-hidden"
    >
      {/* Professional Grid Background */}
      <div className="absolute inset-0 z-[-1] opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-text-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className={`flex flex-col items-center max-w-5xl mx-auto relative z-10 transition-all duration-700 ease-in-out w-full ${!metadata && !analyzeMutation.isPending ? 'min-h-[60vh] justify-center mt-[-10vh]' : 'justify-start'} space-y-8 md:space-y-12`}>
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 md:mb-10"
          >
            {/* Hero elements (headings, labels) removed for ultra-clean UI */}
          </motion.div>

          {/* URL Input */}
          <div className="w-full max-w-3xl">
            <URLInput url={inputUrl} onUrlChange={setInputUrl} onAnalyze={handleAnalyze} isLoading={analyzeMutation.isPending} />
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
                {/* Notices warnings removed to keep UI clean */}

                {isDownloadBlocked && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold"
                    style={{ color: 'var(--color-error)' }}>
                    Download is blocked because this link is DRM protected.
                  </div>
                )}

                {!isDownloadBlocked && !currentJobId && (
                  <FormatSelector
                    selected={selectedFormat}
                    onSelect={setSelectedFormat}
                    availableFormats={metadata.formats}
                    downloadOptions={metadata.downloadOptions}
                    durationSeconds={metadata.durationSeconds || null}
                    allowFallback={!Array.isArray(metadata.downloadOptions)}
                  />
                )}

                {selectedFormat && !currentJobId && !isDownloadBlocked && (
                  <DownloadButton
                    onClick={handleDownload}
                    disabled={!selectedFormat}
                    isLoading={downloadMutation.isPending}
                  />
                )}

                {!isDownloadBlocked && !hasOptions && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold opacity-80">
                    No compatible download options were found for this URL.
                  </div>
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
                    speed={jobStatus.speed}
                    downloadedBytes={jobStatus.downloadedBytes}
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
