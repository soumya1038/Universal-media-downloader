import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { path: '/',         label: 'Home',     icon: 'home' },
  { path: '/history',  label: 'History',  icon: 'history' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Navbar({ toggleTheme, theme, isCollapsed, onToggleCollapse }) {
  const location = useLocation();

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className={`hidden md:flex h-screen fixed left-0 top-0 z-40 flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        }`}
        style={{ background: 'var(--surface-container)', borderRight: '1px solid var(--outline-variant)' }}
      >
        {/* Brand */}
        <div className={`flex items-center h-16 shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-5 gap-3'}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_download</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--on-surface)' }}>Media DL</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--on-surface-variant)' }}>Universal Downloader</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 flex flex-col gap-1 px-3 pt-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                title={isCollapsed ? link.label : undefined}
                className={`relative flex items-center rounded-xl text-[13px] font-medium no-underline transition-all duration-150 ${
                  isCollapsed ? 'justify-center w-12 h-11 mx-auto' : 'gap-3 px-3.5 py-2.5'
                }`}
                style={{
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-container-high)'; e.currentTarget.style.color = isActive ? 'var(--on-primary)' : 'var(--on-surface)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)'; }}
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {link.icon}
                </span>
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '12px' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium border-none bg-transparent cursor-pointer transition-all duration-150 ${
              isCollapsed ? 'justify-center w-12 h-11 mx-auto' : 'gap-3 px-3.5 py-2.5 w-full'
            }`}
            style={{ color: 'var(--on-surface-variant)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-container-high)'; e.currentTarget.style.color = 'var(--on-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
          >
            <span className="material-symbols-outlined text-xl">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            className={`flex items-center rounded-xl text-[13px] font-medium border-none bg-transparent cursor-pointer transition-all duration-150 ${
              isCollapsed ? 'justify-center w-12 h-11 mx-auto' : 'gap-3 px-3.5 py-2.5 w-full'
            }`}
            style={{ color: 'var(--on-surface-variant)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-container-high)'; e.currentTarget.style.color = 'var(--on-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
          >
            <span className="material-symbols-outlined text-xl">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ─── Mobile Bottom Bar ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2"
        style={{
          height: '60px',
          background: 'var(--surface-container)',
          borderTop: '1px solid var(--outline-variant)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
        }}
      >
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className="flex flex-col items-center justify-center py-1.5 px-4 rounded-xl no-underline transition-all duration-150"
              style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)' }}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {link.icon}
              </span>
              <span className="text-[10px] mt-0.5 font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
