import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';

let ddbDocClient: DynamoDBDocumentClient | null = null;

export function getDynamoDocClient(): DynamoDBDocumentClient | null {
  if (ddbDocClient) return ddbDocClient;

  // If AWS credentials or AWS_LAMBDA_FUNCTION_NAME or AWS_EXECUTION_ENV are set, initialize real DynamoDB client
  if (process.env.AWS_EXECUTION_ENV || process.env.AWS_ACCESS_KEY_ID || process.env.DYNAMODB_ENDPOINT) {
    try {
      const client = new DynamoDBClient({
        region: config.awsRegion,
        endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
      });
      ddbDocClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      });
      return ddbDocClient;
    } catch (err) {
      console.warn('Could not initialize AWS DynamoDB client, falling back to repository storage:', err);
      return null;
    }
  }

  return null;
}
