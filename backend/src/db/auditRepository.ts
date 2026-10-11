import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AuditRecord } from '../types.js';
import { config } from '../config.js';
import { getDynamoDocClient } from './dynamoClient.js';

const inMemoryAudits: AuditRecord[] = [
  {
    auditId: 'audit-init-001',
    action: 'VERIFY',
    reportId: 'demo-chennai-001',
    adminId: 'admin-mod-1',
    adminEmail: 'chief.warden@jalrakshak.org',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reason: 'Verified through live municipal CCTV water monitoring feed.',
    previousStatus: 'UNVERIFIED',
    newStatus: 'VERIFIED',
  },
  {
    auditId: 'audit-init-002',
    action: 'VERIFY',
    reportId: 'demo-chennai-002',
    adminId: 'admin-mod-2',
    adminEmail: 'inspector.flood@jalrakshak.org',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    reason: 'Direct field confirmation from South Usman Road disaster rescue squad.',
    previousStatus: 'UNVERIFIED',
    newStatus: 'VERIFIED',
  },
];

export async function saveAuditRecord(record: AuditRecord): Promise<AuditRecord> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      await ddb.send(
        new PutCommand({
          TableName: config.auditTableName,
          Item: record,
        })
      );
    } catch (err) {
      console.warn('DynamoDB PutCommand for audit record failed:', err);
    }
  }
  inMemoryAudits.unshift(record);
  return record;
}

export async function listAuditRecords(limit: number = 50): Promise<AuditRecord[]> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      const res = await ddb.send(
        new ScanCommand({
          TableName: config.auditTableName,
          Limit: limit,
        })
      );
      if (res.Items && res.Items.length > 0) {
        return (res.Items as AuditRecord[]).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    } catch (err) {
      console.warn('DynamoDB ScanCommand for audit records failed:', err);
    }
  }
  return inMemoryAudits.slice(0, limit);
}
