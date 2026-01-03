import { useState, useEffect, useCallback } from 'react';

export interface ActivityEvent {
  ts: number;
  event: 'start' | 'end';
  type: 'agent' | 'skill';
  name: string;
  id: string;
  parent?: string;
}

export interface ActivityState {
  activeNodes: Set<string>;
  events: ActivityEvent[];
  isConnected: boolean;
  error: string | null;
}

const SSE_SERVER_URL = 'http://localhost:3001/events';

export function useActivityStream(enabled: boolean = true) {
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processEvent = useCallback((event: ActivityEvent) => {
    const nodeId = `${event.type}:${event.name}`;

    setActiveNodes(prev => {
      const next = new Set(prev);
      if (event.event === 'start') {
        next.add(nodeId);
      } else if (event.event === 'end') {
        next.delete(nodeId);
      }
      return next;
    });

    setEvents(prev => [...prev.slice(-99), event]); // 최근 100개 유지
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(SSE_SERVER_URL);

        eventSource.addEventListener('connected', () => {
          setIsConnected(true);
          setError(null);
          console.log('🔗 Activity stream connected');
        });

        eventSource.addEventListener('activity', (e: MessageEvent) => {
          try {
            const data: ActivityEvent = JSON.parse(e.data);
            processEvent(data);
          } catch (err) {
            console.error('Failed to parse activity event:', err);
          }
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          setError('Connection lost. Retrying...');
          eventSource?.close();

          // 3초 후 재연결 시도
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setError('Failed to connect to activity stream');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [enabled, processEvent]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const clearActiveNodes = useCallback(() => {
    setActiveNodes(new Set());
  }, []);

  return {
    activeNodes,
    events,
    isConnected,
    error,
    clearEvents,
    clearActiveNodes,
  };
}
