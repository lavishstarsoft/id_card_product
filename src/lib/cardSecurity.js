import crypto from 'crypto';

const DEFAULT_QR_SECRET = process.env.JWT_SECRET || 'rkvision_default_qr_secret';

function getSecret() {
  return process.env.QR_SIGNING_SECRET || DEFAULT_QR_SECRET;
}

export function generateCardId() {
  return crypto.randomUUID().replace(/-/g, '');
}

export function signCardPayload(cardId, pressId) {
  const payload = `${cardId}:${pressId}`;
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex');
}

export function safeSignatureMatch(providedSignature, expectedSignature) {
  const provided = Buffer.from(String(providedSignature || ''), 'utf8');
  const expected = Buffer.from(String(expectedSignature || ''), 'utf8');

  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}
