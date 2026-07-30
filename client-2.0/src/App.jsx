import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Titlebar from './components/Titlebar';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import { useSSE } from './hooks/useSSE';
import DropZone from './components/DropZone';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState([]);

  // Persisted state across page reloads (F5) and tab navigation
  const [singleCards, setSingleCards] = useState(() => {
    try {
      const saved = localStorage.getItem('mediaDownloaderSingleCards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [batchItems, setBatchItems] = useState([]);

  // Sync singleCards to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mediaDownloaderSingleCards', JSON.stringify(singleCards));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [singleCards]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);

    // Native Desktop Notification trigger if Electron
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification({
        title: type === 'error' ? 'Download Error' : 'Media Downloader',
        body: message,
      });
    }
  }, []);

  const handleDropUrl = (url) => {
    navigate('/');
    const cardId = `drop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const loadingCard = {
      id: cardId,
      url,
      isAnalyzing: true,
      metadata: {
        title: 'Analyzing Dropped Link...',
        thumbnail: null,
        platform: 'Fetching video options...',
      },
      selectedFormat: null,
      jobId: null,
      jobStatus: null,
      progress: 0,
      speed: null,
      eta: null,
      downloadUrl: null,
      fileSize: null,
      error: null,
    };
    setSingleCards(prev => [loadingCard, ...prev]);

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setSingleCards(prev => prev.map(c => {
            if (c.id === cardId) {
              return {
                ...c,
                isAnalyzing: false,
                metadata: res.data,
                selectedFormat: res.data.downloadOptions?.[0] || null,
              };
            }
            return c;
          }));
          addToast("Dropped URL analyzed successfully", "success");
        } else {
          setSingleCards(prev => prev.map(c => {
            if (c.id === cardId) return { ...c, isAnalyzing: false, error: res.error || "Failed to analyze URL" };
            return c;
          }));
          addToast(res.error || "Failed to analyze URL", "error");
        }
      })
      .catch((err) => {
        setSingleCards(prev => prev.map(c => {
          if (c.id === cardId) return { ...c, isAnalyzing: false, error: err.message };
          return c;
        }));
      });
  };

  // Real-Time SSE Progress Listener
  const handleJobProgressEvent = useCallback((data) => {
    if (!data || !data.jobId) return;

    setSingleCards(prev => prev.map(card => {
      if (card.jobId === data.jobId) {
        return {
          ...card,
          jobStatus: data.status || card.jobStatus,
          progress: data.progress !== undefined ? data.progress : card.progress,
          speed: data.speed !== undefined ? data.speed : card.speed,
          eta: data.eta !== undefined ? data.eta : card.eta,
          fileSize: data.fileSize !== undefined ? data.fileSize : card.fileSize,
          downloadUrl: data.downloadUrl || card.downloadUrl,
          error: data.error || card.error,
        };
      }
      return card;
    }));

    setBatchItems(prev => prev.map(item => {
      if (item.jobId === data.jobId) {
        return {
          ...item,
          status: data.status === 'completed' ? 'completed' : data.status === 'failed' ? 'failed' : 'downloading',
          progress: data.progress !== undefined ? data.progress : item.progress,
          downloadUrl: data.downloadUrl || item.downloadUrl,
        };
      }
      return item;
    }));

    // Invalidate history query so History tab updates live in real-time
    queryClient.invalidateQueries({ queryKey: ['history'] });
  }, [queryClient]);

  useSSE(handleJobProgressEvent);

  // Retry Workflow: Immediately creates analyzing loading card on Home, deletes old history record, fetches formats
  const handleRetryJob = (job) => {
    navigate('/');
    if (!job?.url) return;

    // Delete old failed/cancelled job record from backend history so duplicate cards don't clutter History
    if (job.id) {
      fetch(`/api/history/${job.id}`, { method: 'DELETE' })
        .then(() => queryClient.invalidateQueries({ queryKey: ['history'] }))
        .catch(() => {});
    }

    const cardId = `retry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const loadingCard = {
      id: cardId,
      url: job.url,
      isAnalyzing: true,
      metadata: {
        title: job.title || 'Analyzing Media Link...',
        thumbnail: job.thumbnail || null,
        platform: job.platform || 'Fetching options...',
      },
      selectedFormat: null,
      jobId: null,
      jobStatus: null,
      progress: 0,
      speed: null,
      eta: null,
      downloadUrl: null,
      fileSize: null,
      error: null,
    };

    // Place loading card at top of Home list
    setSingleCards(prev => [loadingCard, ...prev.filter(c => c.url !== job.url)]);
    addToast(`Re-analyzing link for full format options...`, 'info');

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: job.url }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setSingleCards(prev => prev.map(c => {
            if (c.id === cardId || c.url === job.url) {
              return {
                ...c,
                isAnalyzing: false,
                metadata: res.data,
                selectedFormat: res.data.downloadOptions?.[0] || null,
                error: null,
              };
            }
            return c;
          }));
          addToast("Format options loaded! Select format & quality to start retry", "success");
        } else {
          setSingleCards(prev => prev.map(c => {
            if (c.id === cardId || c.url === job.url) {
              return { ...c, isAnalyzing: false, error: res.error || "Failed to analyze URL" };
            }
            return c;
          }));
          addToast(res.error || "Failed to analyze URL for retry", "error");
        }
      })
      .catch((err) => {
        setSingleCards(prev => prev.map(c => {
          if (c.id === cardId || c.url === job.url) {
            return { ...c, isAnalyzing: false, error: err.message || "Failed to analyze URL" };
          }
          return c;
        }));
        addToast(err.message || "Failed to retry", "error");
      });
  };

  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [theme]);

  // Auto-hydrate running jobs from backend on initial mount
  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const runningOrRecent = data.data.filter(j => ['processing', 'queued'].includes(j.status));
          if (runningOrRecent.length > 0) {
            setSingleCards(prev => {
              const existingJobIds = new Set(prev.map(p => p.jobId));
              const toAddCards = runningOrRecent.filter(r => !existingJobIds.has(r.id)).map(r => ({
                id: `hydrated-${r.id}`,
                url: r.url,
                metadata: {
                  title: r.title,
                  thumbnail: r.thumbnail,
                  platform: r.platform,
                  downloadOptions: [{ id: 'opt-hydrated', quality: r.quality || 'Standard', format: r.format || 'mp4' }]
                },
                selectedFormat: { id: 'opt-hydrated', quality: r.quality || 'Standard', format: r.format || 'mp4' },
                jobId: r.id,
                jobStatus: r.status,
                progress: r.progress || 0,
                speed: r.speed,
                eta: r.eta,
                downloadUrl: r.downloadUrl,
                fileSize: r.fileSize,
              }));
              return [...toAddCards, ...prev];
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebarCollapsed', String(next)); } catch (e) {}
      return next;
    });
  };

  const toastIcon = (type) => {
    switch (type) {
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'check_circle';
    }
  };

  const toastColor = (type) => {
    switch (type) {
      case 'error': return 'var(--error)';
      case 'info': return 'var(--primary)';
      default: return 'var(--success)';
    }
  };

  return (
    <>
      <Titlebar />
      <DropZone onDropUrl={handleDropUrl} />

      {/* Toast Notifications */}
      <div className="fixed top-10 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '340px', width: '100%' }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex items-center gap-3 rounded-xl overflow-hidden"
              style={{
                background: 'var(--surface-container)',
                border: '1px solid var(--outline-variant)',
                boxShadow: 'var(--shadow-lg)',
                padding: '12px 16px',
              }}
            >
              <div className="w-1 h-8 rounded-full shrink-0" style={{ background: toastColor(toast.type) }} />
              <span className="material-symbols-outlined text-lg shrink-0" style={{ color: toastColor(toast.type), fontVariationSettings: "'FILL' 1" }}>
                {toastIcon(toast.type)}
              </span>
              <p className="text-xs font-medium flex-1 leading-snug" style={{ color: 'var(--on-surface)' }}>
                {toast.message}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ background: 'var(--bg)', color: 'var(--on-bg)' }}>
        <Navbar
          toggleTheme={toggleTheme}
          theme={theme}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <main
          className={`flex-1 min-h-screen relative pb-20 md:pb-8 pt-6 px-4 md:px-8 transition-all duration-300 ${
            isSidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-60'
          }`}
          style={{ maxWidth: '1200px' }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <Home
                      addToast={addToast}
                      singleCards={singleCards}
                      setSingleCards={setSingleCards}
                      batchItems={batchItems}
                      setBatchItems={setBatchItems}
                    />
                  }
                />
                <Route path="/history" element={<History addToast={addToast} onRetryJob={handleRetryJob} />} />
                <Route path="/settings" element={<Settings theme={theme} toggleTheme={toggleTheme} addToast={addToast} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
