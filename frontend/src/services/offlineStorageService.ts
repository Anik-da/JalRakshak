import { FloodReport, MultiHorizonRiskAssessment, CreateReportInput } from '../types';
import { api } from './api';

const REPORTS_CACHE_KEY = 'jalrakshak_cached_reports';
const RISK_CACHE_KEY = 'jalrakshak_cached_risk';
const OFFLINE_QUEUE_KEY = 'jalrakshak_offline_queue';
const LAST_SYNC_KEY = 'jalrakshak_last_sync_timestamp';

export interface QueuedOfflineReport {
  queueId: string;
  reportData: CreateReportInput;
  queuedAt: string;
  attempts: number;
}

/**
 * Saves reports to local offline storage cache.
 */
export function cacheReportsLocally(reports: FloodReport[]): void {
  try {
    localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(reports.slice(0, 50)));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to cache reports locally:', err);
  }
}

/**
 * Retrieves cached reports from local storage.
 */
export function getLocallyCachedReports(): FloodReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves latest risk assessment snapshot locally.
 */
export function cacheRiskAssessmentLocally(assessment: MultiHorizonRiskAssessment): void {
  try {
    localStorage.setItem(RISK_CACHE_KEY, JSON.stringify(assessment));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to cache risk assessment locally:', err);
  }
}

/**
 * Retrieves cached risk assessment.
 */
export function getLocallyCachedRiskAssessment(): MultiHorizonRiskAssessment | null {
  try {
    const raw = localStorage.getItem(RISK_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Gets the last known successful synchronization timestamp.
 */
export function getLastSyncTimestamp(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

/**
 * Enqueues a report for synchronization when internet connectivity is offline or failing.
 */
export function enqueueOfflineReport(reportInput: CreateReportInput): QueuedOfflineReport {
  const queueId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item: QueuedOfflineReport = {
    queueId,
    reportData: reportInput,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };

  try {
    const existing = getQueuedOfflineReports();
    // Prevent exact duplicate enqueueing
    const duplicate = existing.find(
      (q) =>
        q.reportData.locationName === reportInput.locationName &&
        Math.abs(q.reportData.latitude - reportInput.latitude) < 0.0001 &&
        Math.abs(q.reportData.longitude - reportInput.longitude) < 0.0001
    );
    if (!duplicate) {
      existing.push(item);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn('Failed to queue offline report:', err);
  }

  return item;
}

/**
 * Retrieves all currently queued offline reports.
 */
export function getQueuedOfflineReports(): QueuedOfflineReport[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Synchronizes and flushes pending offline reports to API server.
 */
export async function syncOfflineReportsQueue(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = getQueuedOfflineReports();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let synced = 0;
  let failed = 0;
  const remaining: QueuedOfflineReport[] = [];

  for (const item of queue) {
    try {
      await api.createReport({
        ...item.reportData,
        consentPublicSharing: item.reportData.consentPublicSharing ?? true,
      });
      synced++;
    } catch (err) {
      console.warn(`Failed to sync queued report ${item.queueId}:`, err);
      item.attempts += 1;
      if (item.attempts < 5) {
        remaining.push(item);
      }
      failed++;
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.warn('Failed to update offline queue storage:', err);
  }

  return { syncedCount: synced, failedCount: failed };
}
