import { useEffect } from 'react';

export function useSSE(onJobProgress) {
  useEffect(() => {
    let eventSource = null;

    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      eventSource = new EventSource(`${API_BASE}/api/events`);

      eventSource.addEventListener('job_progress', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (onJobProgress && data) {
            onJobProgress(data);
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.onerror = () => {
        // EventSource automatically reconnects on error
      };
    } catch (e) {
      console.error('SSE setup failed:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [onJobProgress]);
}
