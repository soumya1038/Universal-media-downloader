import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Settings, Sun, Moon, Rocket, X, Menu } from 'lucide-react';

const navLinks = [
  { path: '/history',  label: 'History',  icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar({ toggleTheme, theme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-5 pb-2 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto w-full max-w-3xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card !rounded-full !py-2 !px-4 shadow-xl flex items-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Link to="/" className="flex items-center gap-2 no-underline group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12"
                style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dim))' }}>
                <Rocket size={14} color="white" />
              </div>
              <span className="font-display font-black text-base tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                Media<span style={{ color: 'var(--color-accent)' }}>DL</span>
              </span>
            </Link>
          </motion.div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop links */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex glass-card !rounded-full !p-1.5 !px-3 shadow-xl items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="no-underline px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 relative"
                  style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full z-[-1]"
                      style={{ background: 'var(--color-surface-hover)' }}
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <Icon size={13} strokeWidth={3} />
                  {link.label}
                </Link>
              );
            })}
          </motion.div>

          {/* Action pod */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card !rounded-full !p-1 shadow-xl flex items-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all hover:bg-white/10 active:scale-90"
                style={{ color: 'var(--color-text-primary)' }}
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-blue-500" />}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Mobile hamburger */}
              <button
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer hover:bg-white/10 active:scale-90"
                onClick={() => setMobileOpen(true)}
                style={{ color: 'var(--color-text-primary)', background: 'transparent' }}
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Mobile drawer — outside the pointer-events-none nav */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
              style={{ zIndex: 9998 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 md:hidden flex flex-col"
              style={{
                zIndex: 9999,
                background: 'var(--bg-color-mid)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between p-6 pb-4">
                <span className="font-display font-black text-xl italic" style={{ color: 'var(--color-accent)' }}>MENU</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)' }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-1 px-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className="no-underline flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
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

              {/* Theme toggle in drawer */}
              <div className="mt-auto p-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => { toggleTheme(); }}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-secondary)' }}
                >
                  {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
