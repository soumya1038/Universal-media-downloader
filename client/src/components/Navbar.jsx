import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, History, Settings, Sun, Moon, Rocket, X } from 'lucide-react';

const navLinks = [
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar({ toggleTheme, theme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-8 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto max-w-fit">
        {/* Logo Pod */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card !rounded-full !py-2.5 !px-5 shadow-2xl flex items-center bg-white/5 border border-white/10"
        >
          <Link to="/" className="flex items-center gap-2 no-underline group pointer-events-auto">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12"
              style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dim))' }}>
              <Rocket size={16} color="white" />
            </div>
            <span className="font-display font-black text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Media<span style={{ color: 'var(--color-accent)' }}>DL</span>
            </span>
          </Link>
        </motion.div>

        {/* Links Pod (Desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex glass-card !rounded-full !p-2 px-4 shadow-2xl items-center gap-8 bg-white/5 border border-white/10"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="no-underline px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 relative group overflow-hidden"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full z-[-1]"
                    style={{ background: 'var(--color-surface-hover)' }}
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.6 }}
                  />
                )}
                <Icon size={14} strokeWidth={3} className="transition-transform group-hover:scale-110" />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </motion.div>

        {/* Action Pod */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card !rounded-full !p-1 shadow-2xl flex items-center bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-500 hover:bg-white/10 active:scale-90"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer bg-white/5 hover:bg-white/10 active:scale-90"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: 'var(--color-text-primary)' }}
            >
              {mobileOpen ? <X size={18} /> : <Rocket size={18} className="rotate-90" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-72 z-50 bg-[#0a0a0f] border-l border-white/10 md:hidden p-8 flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-2xl italic" style={{ color: 'var(--color-accent)' }}>MENU</span>
                <button onClick={() => setMobileOpen(false)} className="bg-white/5 p-2 rounded-full border-none cursor-pointer text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className="no-underline flex items-center gap-4 px-6 py-5 rounded-3xl text-sm font-black uppercase tracking-widest transition-all"
                      style={{
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        background: isActive ? 'rgba(255,126,103,0.1)' : 'transparent',
                      }}
                    >
                      <Icon size={18} strokeWidth={3} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
