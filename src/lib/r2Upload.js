import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function buildClient() {
  const accountId = getEnv('CLOUDFLARE_ACCOUNT_ID');
  const accessKeyId = getEnv('CLOUDFLARE_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('CLOUDFLARE_SECRET_ACCESS_KEY');

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

function extensionFromMime(mimeType) {
  const short = mimeType.split('/')[1] || 'png';
  if (short.includes('jpeg')) return 'jpg';
  return short;
}

export async function uploadImageIfBase64(imageValue, keyPrefix) {
  if (!imageValue) return imageValue;
  if (/^https?:\/\//i.test(imageValue)) return imageValue;

  const parsed = parseDataUrl(imageValue);
  if (!parsed) return imageValue;

  const bucket = getEnv('CLOUDFLARE_R2_BUCKET_NAME');
  const publicBaseUrl = getEnv('CLOUDFLARE_R2_PUBLIC_URL').replace(/\/+$/, '');
  const ext = extensionFromMime(parsed.contentType);
  const objectKey = `${keyPrefix}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const client = buildClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: parsed.buffer,
    ContentType: parsed.contentType
  }));

  return `${publicBaseUrl}/${objectKey}`;
}

function safeParseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function extractObjectKey(pathname) {
  return pathname.replace(/^\/+/, '');
}

export async function getDisplayImageUrl(imageValue) {
  if (!imageValue || !/^https?:\/\//i.test(imageValue)) return imageValue;

  const parsed = safeParseUrl(imageValue);
  if (!parsed) return imageValue;

  // R2 API endpoint URLs are not publicly readable by browsers.
  // Generate a short-lived signed URL so profile/signature images can render.
  if (!parsed.hostname.endsWith('.r2.cloudflarestorage.com')) return imageValue;

  const objectKey = extractObjectKey(parsed.pathname);
  if (!objectKey) return imageValue;

  const bucket = getEnv('CLOUDFLARE_R2_BUCKET_NAME');
  const client = buildClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey
    }),
    { expiresIn: 60 * 60 }
  );
}
