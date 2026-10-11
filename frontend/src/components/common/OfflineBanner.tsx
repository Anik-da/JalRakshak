import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  getLastSyncTimestamp,
  getQueuedOfflineReports,
  syncOfflineReportsQueue,
} from '../../services/offlineStorageService';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTimestamp());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setQueuedCount(getQueuedOfflineReports().length);
      setLastSync(getLastSyncTimestamp());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setQueuedCount(getQueuedOfflineReports().length);
    setLastSync(getLastSyncTimestamp());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await syncOfflineReportsQueue();
      if (res.syncedCount > 0) {
        setSyncSuccessMsg(`Successfully synchronized ${res.syncedCount} queued reports.`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      }
      setQueuedCount(getQueuedOfflineReports().length);
      setLastSync(getLastSyncTimestamp());
    } finally {
      setSyncing(false);
    }
  };

  // If online and no queued reports and no sync message, do not show banner
  if (isOnline && queuedCount === 0 && !syncSuccessMsg) {
    return null;
  }

  return (
    <div className="bg-risk-mod-bg/95 border-b border-risk-mod/40 px-4 py-2.5 text-xs text-carto-text backdrop-blur-md sticky top-0 z-50 animate-fade-in shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {!isOnline ? (
            <div className="flex items-center space-x-1.5 text-risk-crit font-bold">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>OFFLINE MODE: Displaying Cached Emergency Telemetry</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-forest font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Network Restored</span>
            </div>
          )}

          {lastSync && (
            <span className="hidden md:inline-flex items-center space-x-1 text-carto-muted font-mono text-[11px] pl-2 border-l border-carto-border">
              <Clock className="w-3 h-3" />
              <span>Last Cached: {new Date(lastSync).toLocaleTimeString()}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          {queuedCount > 0 && (
            <span className="bg-surface px-2 py-0.5 rounded border border-carto-border font-mono text-[11px] text-carto-muted">
              {queuedCount} report{queuedCount > 1 ? 's' : ''} queued locally
            </span>
          )}

          {syncSuccessMsg && (
            <span className="text-forest font-semibold text-[11px]">
              {syncSuccessMsg}
            </span>
          )}

          {isOnline && queuedCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="inline-flex items-center space-x-1 bg-forest hover:bg-forest-deep text-white px-2.5 py-1 rounded text-[11px] font-medium transition shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Pending'}</span>
            </button>
          )}

          <div className="hidden lg:flex items-center space-x-1 text-[11px] text-risk-crit font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Turn Around Don’t Drown</span>
          </div>
        </div>
      </div>
    </div>
  );
};
