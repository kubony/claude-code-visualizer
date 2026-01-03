import React from 'react';
import { ActivityEvent } from '../hooks/useActivityStream';

interface CallStackProps {
  activeNodes: Set<string>;
  events: ActivityEvent[];
  isConnected: boolean;
  error: string | null;
}

export function CallStack({ activeNodes, events, isConnected, error }: CallStackProps) {
  return (
    <div className="call-stack">
      <div className="call-stack-header">
        <h3>Activity Stream</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {error && (
        <div className="error-message">
          Connection error: {error}
        </div>
      )}

      <style>{`
        .call-stack {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          font-size: 14px;
        }

        .call-stack-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .call-stack-header h3 {
          margin: 0;
          font-size: 16px;
          color: #e2e8f0;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 12px;
          background: #334155;
          font-weight: 500;
        }

        .connection-status.connected {
          color: #4ade80;
        }

        .connection-status.disconnected {
          color: #f87171;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        .connection-status.disconnected .status-dot {
          animation: none;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .error-message {
          background: #7f1d1d;
          color: #fecaca;
          padding: 8px 12px;
          border-radius: 6px;
          margin-top: 12px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
