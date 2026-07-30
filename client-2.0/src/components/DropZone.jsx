import React, { useState, useEffect } from 'react';

export default function DropZone({ onDropUrl }) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer.types.includes('text/plain') || e.dataTransfer.types.includes('text/uri-list')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) setIsDragging(false);
    };

    const handleDragOver = (e) => { e.preventDefault(); };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);
      const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
      if (text && text.trim() && onDropUrl) onDropUrl(text.trim());
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onDropUrl]);

  if (!isDragging) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none"
      style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="p-10 max-w-sm w-full text-center space-y-4 rounded-2xl"
        style={{
          background: 'var(--surface-container)',
          border: '2px dashed var(--primary)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}>
          <span className="material-symbols-outlined text-3xl animate-bounce">cloud_upload</span>
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Drop URL Here</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>Release to analyze media</p>
        </div>
      </div>
    </div>
  );
}
