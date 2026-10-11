export interface AppConfig {
  awsRegion: string;
  reportsTableName: string;
  riskTableName: string;
  auditTableName: string;
  weatherCacheTableName: string;
  userAlertsTableName: string;
  riskHistoryTableName: string;
  feedbackTableName: string;
  predictionsTableName: string;
  reportImagesBucket: string;
  userPoolId: string;
  userPoolClientId: string;
  bedrockModelId: string;
  snsTopicArn?: string;
  sesSenderEmail: string;
  environment: string;
  publicAppOrigin: string;
  port: number;
}

export const config: AppConfig = {
  awsRegion: process.env.AWS_REGION || 'ap-south-1',
  reportsTableName: process.env.REPORTS_TABLE_NAME || 'JalRakshak-Reports-dev',
  riskTableName: process.env.RISK_TABLE_NAME || 'JalRakshak-Risk-dev',
  auditTableName: process.env.AUDIT_TABLE_NAME || 'JalRakshak-Audit-dev',
  weatherCacheTableName: process.env.WEATHER_CACHE_TABLE_NAME || 'JalRakshak-WeatherCache-dev',
  userAlertsTableName: process.env.USER_ALERTS_TABLE_NAME || 'JalRakshak-UserAlerts-dev',
  riskHistoryTableName: process.env.RISK_HISTORY_TABLE_NAME || 'JalRakshak-RiskHistory-dev',
  feedbackTableName: process.env.FEEDBACK_TABLE_NAME || 'JalRakshak-Feedback-dev',
  predictionsTableName: process.env.PREDICTIONS_TABLE_NAME || 'JalRakshak-Predictions-dev',
  reportImagesBucket: process.env.REPORT_IMAGES_BUCKET || 'jalrakshak-report-images-dev',
  userPoolId: process.env.USER_POOL_ID || 'ap-south-1_mockPoolId',
  userPoolClientId: process.env.USER_POOL_CLIENT_ID || 'mockClientId12345',
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 'global.amazon.nova-2-lite-v1:0',
  snsTopicArn: process.env.SNS_TOPIC_ARN,
  sesSenderEmail: process.env.SES_SENDER_EMAIL || 'alerts@jalrakshak.org',
  environment: process.env.ENVIRONMENT || 'development',
  publicAppOrigin: process.env.PUBLIC_APP_ORIGIN || 'http://localhost:5173',
  port: parseInt(process.env.PORT || '4000', 10),
};
