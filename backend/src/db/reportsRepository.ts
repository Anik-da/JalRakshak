import {
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { FloodReport, VerificationStatus, SeverityLevel, RoadCondition } from '../types.js';
import { config } from '../config.js';
import { getDynamoDocClient } from './dynamoClient.js';

// In-memory backing store for local testing and offline execution
const inMemoryReports = new Map<string, FloodReport>();

// Demonstration dataset: Clearly labelled sample reports for testing/previewing map behavior
export const DEMONSTRATION_REPORTS: FloodReport[] = [
  {
    reportId: 'demo-chennai-001',
    userId: 'demo-user-1',
    userEmailMasked: 'c***@community.in',
    latitude: 13.0827,
    longitude: 80.2707,
    locationName: 'Poonamallee High Road, Central',
    severity: 'HIGH',
    waterDepthCm: 45,
    roadCondition: 'DIFFICULT',
    description: 'Underpass drainage overflow causing 1.5ft water accumulation near railway bridge.',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    observedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    status: 'VERIFIED',
    verifiedBy: 'admin-mod-1',
    verificationNotes: 'Verified via traffic camera observation feed.',
    verificationTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    flagCount: 0,
    isDemonstration: true,
  },
  {
    reportId: 'demo-chennai-002',
    userId: 'demo-user-2',
    userEmailMasked: 'r***@resident.org',
    latitude: 13.0418,
    longitude: 80.2341,
    locationName: 'T. Nagar South Usman Road',
    severity: 'CRITICAL',
    waterDepthCm: 70,
    roadCondition: 'BLOCKED',
    description: 'Severe waterlogging under flyover. Cars stranded, road closed by traffic police.',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    observedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    status: 'VERIFIED',
    verifiedBy: 'admin-mod-2',
    verificationNotes: 'Confirmed by civic ward coordinator.',
    verificationTimestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    flagCount: 0,
    isDemonstration: true,
  },
  {
    reportId: 'demo-chennai-003',
    userId: 'demo-user-3',
    userEmailMasked: 's***@navigator.in',
    latitude: 12.9815,
    longitude: 80.218,
    locationName: 'Velachery Bypass Road',
    severity: 'MODERATE',
    waterDepthCm: 25,
    roadCondition: 'PASSABLE',
    description: 'Slow-moving water near residential junction. Passable for heavy vehicles with caution.',
    observedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'UNVERIFIED',
    flagCount: 0,
    isDemonstration: true,
  },
  {
    reportId: 'demo-chennai-004',
    userId: 'demo-user-4',
    userEmailMasked: 'a***@commuter.org',
    latitude: 12.9716,
    longitude: 80.2435,
    locationName: 'OMR Sholinganallur Junction',
    severity: 'LOW',
    waterDepthCm: 10,
    roadCondition: 'PASSABLE',
    description: 'Puddles in service lane after sharp shower, main expressway carriageway completely clear.',
    observedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
    status: 'UNVERIFIED',
    flagCount: 0,
    isDemonstration: true,
  },
];

// Initialize in-memory store with demonstration records
DEMONSTRATION_REPORTS.forEach((r) => inMemoryReports.set(r.reportId, r));

export async function saveReport(report: FloodReport): Promise<FloodReport> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    await ddb.send(
      new PutCommand({
        TableName: config.reportsTableName,
        Item: report,
      })
    );
  }
  inMemoryReports.set(report.reportId, report);
  return report;
}

export async function getReportById(reportId: string): Promise<FloodReport | null> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      const res = await ddb.send(
        new GetCommand({
          TableName: config.reportsTableName,
          Key: { reportId },
        })
      );
      if (res.Item) return res.Item as FloodReport;
    } catch (err) {
      console.warn('DynamoDB GetCommand error, checking in-memory fallback:', err);
    }
  }
  return inMemoryReports.get(reportId) || null;
}

export interface ListReportsOptions {
  status?: VerificationStatus;
  severity?: SeverityLevel;
  roadCondition?: RoadCondition;
  includeDemonstration?: boolean;
  limit?: number;
}

export async function listReports(options: ListReportsOptions = {}): Promise<FloodReport[]> {
  const { includeDemonstration = false, limit = 100 } = options;
  const ddb = getDynamoDocClient();
  let reports: FloodReport[] = [];

  if (ddb) {
    try {
      const res = await ddb.send(
        new ScanCommand({
          TableName: config.reportsTableName,
          Limit: limit,
        })
      );
      if (res.Items && res.Items.length > 0) {
        reports = res.Items as FloodReport[];
      }
    } catch (err) {
      console.warn('DynamoDB ScanCommand error, using in-memory store:', err);
      reports = Array.from(inMemoryReports.values());
    }
  } else {
    reports = Array.from(inMemoryReports.values());
  }

  // Filter out demonstration reports by default
  if (!includeDemonstration) {
    reports = reports.filter((r) => !r.isDemonstration && !r.reportId.startsWith('demo-'));
  }

  // Filter by status if provided
  if (options.status) {
    reports = reports.filter((r) => r.status === options.status);
  }

  // Filter by severity if provided
  if (options.severity) {
    reports = reports.filter((r) => r.severity === options.severity);
  }

  // Filter by roadCondition if provided
  if (options.roadCondition) {
    reports = reports.filter((r) => r.roadCondition === options.roadCondition);
  }

  // Sort descending by submittedAt / observedAt
  reports.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return reports.slice(0, limit);
}

export async function listUserReports(userId: string): Promise<FloodReport[]> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      const res = await ddb.send(
        new QueryCommand({
          TableName: config.reportsTableName,
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: {
            ':uid': userId,
          },
        })
      );
      if (res.Items) {
        return res.Items as FloodReport[];
      }
    } catch (err) {
      console.warn('DynamoDB QueryCommand for user reports failed, using in-memory fallback:', err);
    }
  }

  return Array.from(inMemoryReports.values()).filter((r) => r.userId === userId);
}

export async function updateReportVerification(
  reportId: string,
  newStatus: VerificationStatus,
  adminId: string,
  notes: string
): Promise<FloodReport | null> {
  const report = await getReportById(reportId);
  if (!report) return null;

  const now = new Date().toISOString();
  report.status = newStatus;
  report.verifiedBy = adminId;
  report.verificationNotes = notes;
  report.verificationTimestamp = now;
  report.updatedAt = now;

  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: config.reportsTableName,
          Key: { reportId },
          UpdateExpression:
            'SET #st = :status, verifiedBy = :admin, verificationNotes = :notes, verificationTimestamp = :ts, updatedAt = :ts',
          ExpressionAttributeNames: {
            '#st': 'status',
          },
          ExpressionAttributeValues: {
            ':status': newStatus,
            ':admin': adminId,
            ':notes': notes,
            ':ts': now,
          },
        })
      );
    } catch (err) {
      console.warn('DynamoDB UpdateCommand error:', err);
    }
  }

  inMemoryReports.set(reportId, report);
  return report;
}

export async function incrementReportFlag(reportId: string): Promise<FloodReport | null> {
  const report = await getReportById(reportId);
  if (!report) return null;

  report.flagCount = (report.flagCount || 0) + 1;
  report.updatedAt = new Date().toISOString();

  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: config.reportsTableName,
          Key: { reportId },
          UpdateExpression: 'ADD flagCount :inc SET updatedAt = :now',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':now': report.updatedAt,
          },
        })
      );
    } catch (err) {
      console.warn('DynamoDB flag increment error:', err);
    }
  }

  inMemoryReports.set(reportId, report);
  return report;
}
