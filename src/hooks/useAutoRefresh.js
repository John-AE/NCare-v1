import { useEffect } from 'react';

export function useAutoRefresh(refreshCallback) {
  useEffect(() => {
    // Set up auto-refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      if (refreshCallback && typeof refreshCallback === 'function') {
        // Call custom refresh function if provided
        refreshCallback();
      } else {
        // Default: reload the page
        window.location.reload();
      }
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [refreshCallback]);
}