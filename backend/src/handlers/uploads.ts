import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';
import { PresignedUploadResponse } from '../types.js';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;
  if (process.env.AWS_EXECUTION_ENV || process.env.AWS_ACCESS_KEY_ID) {
    try {
      s3Client = new S3Client({ region: config.awsRegion });
      return s3Client;
    } catch (e) {
      console.warn('Could not initialize S3Client, using local presign simulation:', e);
    }
  }
  return null;
}

export async function createPresignedUpload(
  fileName: string,
  contentType: string,
  userId: string
): Promise<PresignedUploadResponse> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}. Only JPEG, PNG, and WebP are permitted.`);
  }

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = `reports/${userId}/${timestamp}-${randomSuffix}.${extension}`;

  const client = getS3Client();
  if (client) {
    try {
      const command = new PutObjectCommand({
        Bucket: config.reportImagesBucket,
        Key: key,
        ContentType: contentType,
        Metadata: {
          uploadedBy: userId,
          timestamp: timestamp.toString(),
        },
      });

      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
      const imageUrl = `https://${config.reportImagesBucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        imageUrl,
        key,
        expiresInSeconds: 300,
      };
    } catch (err) {
      console.warn('S3 Presigner error, providing local preview mock:', err);
    }
  }

  // Local development / offline fallback:
  return {
    uploadUrl: `/api/v1/uploads/local-mock?key=${encodeURIComponent(key)}`,
    imageUrl: `https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80`,
    key,
    expiresInSeconds: 300,
  };
}
