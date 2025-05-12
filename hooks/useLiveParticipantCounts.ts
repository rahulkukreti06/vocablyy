import { useEffect, useState } from 'react';

export function useLiveParticipantCounts(rooms: { id: string; name: string }[]) {
  const [counts, setCounts] = useState<{ [roomId: string]: number }>({});

  useEffect(() => {
    let isMounted = true;
    let ws: WebSocket | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    // Determine WebSocket URL based on environment
    let wsUrl = '';
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = 'ws://localhost:3001';
      } else {
        wsUrl = `wss://${window.location.host}/ws`;
      }
    }

    // Try to connect to WebSocket for live updates
    try {
      ws = new window.WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'counts' && data.rooms && typeof data.rooms === 'object') {
            if (isMounted) setCounts(data.rooms);
          }
        } catch {}
      };
      ws.onerror = () => {
        // fallback to polling
        pollInterval = setInterval(fetchCounts, 1000);
      };
      ws.onclose = () => {
        // fallback to polling
        pollInterval = setInterval(fetchCounts, 1000);
      };
    } catch {
      // fallback to polling
      pollInterval = setInterval(fetchCounts, 1000);
    }

    async function fetchCounts() {
      try {
        const resp = await fetch('/api/room-participants');
        const data = await resp.json();
        if (data.rooms && typeof data.rooms === 'object') {
          if (isMounted) setCounts(data.rooms);
        }
      } catch {}
    }

    // Initial fetch in case WebSocket is slow
    fetchCounts();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [rooms]);

  return counts;
}
