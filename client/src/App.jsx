import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BackgroundScene from './components/3d/BackgroundScene';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import { Heart } from 'lucide-react';

export default function App() {
  const location = useLocation();
  const [backgroundDisabled, setBackgroundDisabled] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mediaDownloaderSettings') || '{}');
      return saved.disableBackground || false;
    } catch {
      return false;
    }
  });

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

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleBackgroundToggle = useCallback((disabled) => {
    setBackgroundDisabled(disabled);
  }, []);

  return (
    <>
      <BackgroundScene disabled={backgroundDisabled} theme={theme} />

      <div className="relative z-10 min-h-screen flex flex-col transition-colors duration-500">
        <DisclaimerBanner />
        <Navbar toggleTheme={toggleTheme} theme={theme} />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings onBackgroundToggle={handleBackgroundToggle} />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="text-center py-10 text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/10" />
            <p className="flex items-center gap-1.5">
              Made with <Heart size={12} className="text-red-500 fill-red-500" /> for the Open Web
            </p>
            <p className="opacity-60 font-display"> Universal Media Downloader & Converter © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
