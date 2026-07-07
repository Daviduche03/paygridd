import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^\w.-]+/g, "_").replace(/^\.+/, "");
}

function buildKey(bucket: string | undefined, pathParts: string[]): string {
  const segments = pathParts.filter(Boolean).map(sanitizeSegment);
  if (bucket) {
    return [sanitizeSegment(bucket), ...segments].join("/");
  }
  return segments.join("/");
}

function getPublicUrl(key: string): string | null {
  if (!env.R2_PUBLIC_URL) return null;
  const base = env.R2_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/${key}`;
}

export const r2Service = {
  isConfigured(): boolean {
    return Boolean(
      env.R2_ACCOUNT_ID &&
        env.R2_ACCESS_KEY_ID &&
        env.R2_SECRET_ACCESS_KEY &&
        env.R2_BUCKET_NAME,
    );
  },

  buildKey(bucket: string | undefined, pathParts: string[]): string {
    return buildKey(bucket, pathParts);
  },

  getFileUrl(key: string): string | null {
    return getPublicUrl(key);
  },

  async upload(params: {
    bucket?: string;
    path: string[];
    buffer: Buffer;
    contentType: string;
  }): Promise<{ key: string; url: string | null }> {
    const key = buildKey(params.bucket, params.path);

    await getClient().send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType,
      }),
    );

    logger.info(`Uploaded file to R2: ${key}`);

    return {
      key,
      url: getPublicUrl(key),
    };
  },

  async download(key: string): Promise<{
    body: NodeJS.ReadableStream;
    contentType: string | undefined;
  }> {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error("File not found");
    }

    return {
      body: response.Body as NodeJS.ReadableStream,
      contentType: response.ContentType,
    };
  },
};