import { PredictionFeedback } from './types.js';
import { getDynamoDocClient } from './db/dynamoClient.js';
import { config } from './config.js';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const inMemoryFeedback: PredictionFeedback[] = [
  {
    feedbackId: 'fb-001',
    userId: 'user-community-1',
    latitude: 13.0418,
    longitude: 80.2341,
    localityName: 'T. Nagar South Usman Road',
    predictedCategory: 'CRITICAL',
    observedOutcome: 'ACTUAL_FLOODING_OCCURRED',
    actualWaterDepthCm: 65,
    comments: 'Accurate alert! Subway was completely submerged within 45 minutes of heavy rain.',
    submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    feedbackId: 'fb-002',
    userId: 'user-community-2',
    latitude: 12.9815,
    longitude: 80.218,
    localityName: 'Velachery Bypass Road',
    predictedCategory: 'MODERATE',
    observedOutcome: 'MINOR_WATERLOGGING_ONLY',
    actualWaterDepthCm: 20,
    comments: 'Service lanes had knee-deep puddles, but main road kept moving with caution.',
    submittedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    feedbackId: 'fb-003',
    userId: 'user-community-3',
    latitude: 12.9716,
    longitude: 80.2435,
    localityName: 'OMR Sholinganallur Junction',
    predictedCategory: 'LOW',
    observedOutcome: 'NO_FLOODING_OBSERVED',
    actualWaterDepthCm: 0,
    comments: 'Drains cleared properly before monsoon; carriageway completely dry.',
    submittedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
];

export async function savePredictionFeedback(feedback: PredictionFeedback): Promise<PredictionFeedback> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      await ddb.send(
        new PutCommand({
          TableName: config.feedbackTableName,
          Item: feedback,
        })
      );
    } catch {
      // safe fallback
    }
  }

  inMemoryFeedback.unshift(feedback);
  return feedback;
}

export async function listPredictionFeedback(): Promise<PredictionFeedback[]> {
  const ddb = getDynamoDocClient();
  if (ddb) {
    try {
      const res = await ddb.send(
        new ScanCommand({
          TableName: config.feedbackTableName,
          Limit: 100,
        })
      );
      if (res.Items && res.Items.length > 0) {
        return res.Items as PredictionFeedback[];
      }
    } catch {
      // safe fallback
    }
  }

  return inMemoryFeedback;
}
