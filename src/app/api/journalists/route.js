import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Journalist from '@/lib/Journalist';
import Counter from '@/lib/Counter';
import { generateCardId, signCardPayload } from '@/lib/cardSecurity';
import { uploadImageIfBase64, getDisplayImageUrl } from '@/lib/r2Upload';

const PRESS_ID_COUNTER_KEY = 'journalistPressId';
const PRESS_ID_PREFIX = 'RKV';
const PRESS_ID_PAD = 5;
const PROTECTED_PRESS_ID = 'RKV00003';
const MASTER_CARD_PASSWORD = process.env.MASTER_CARD_PASSWORD || 'rkvision_master_003';

function isProtectedCard(pressId) {
  return pressId === PROTECTED_PRESS_ID;
}

function isValidMasterPassword(password) {
  return String(password || '') === MASTER_CARD_PASSWORD;
}

function formatPressId(seq) {
  return `${PRESS_ID_PREFIX}${String(seq).padStart(PRESS_ID_PAD, '0')}`;
}

async function getNextPressIdPreview() {
  const counter = await Counter.findById(PRESS_ID_COUNTER_KEY);
  return formatPressId((counter?.seq || 0) + 1);
}

async function allocatePressId() {
  const counter = await Counter.findByIdAndUpdate(
    PRESS_ID_COUNTER_KEY,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
  return formatPressId(counter.seq);
}

function buildVerifyUrl(origin, cardId, signature) {
  return `${origin}/verify/${cardId}?sig=${signature}`;
}

function withVerificationMeta(journalist, origin) {
  const doc = journalist?.toObject ? journalist.toObject() : journalist;
  if (!doc?.cardId || !doc?.qrSignature) return doc;
  return {
    ...doc,
    verifyUrl: buildVerifyUrl(origin, doc.cardId, doc.qrSignature)
  };
}

async function withDisplayImages(journalist) {
  const doc = journalist?.toObject ? journalist.toObject() : journalist;
  if (!doc) return doc;

  const [profileImage, signatureImage] = await Promise.all([
    getDisplayImageUrl(doc.profileImage),
    getDisplayImageUrl(doc.signatureImage)
  ]);

  return {
    ...doc,
    profileImage,
    signatureImage
  };
}

export async function GET(request) {
  try {
    await dbConnect();
    const origin = new URL(request.url).origin;
    const { searchParams } = new URL(request.url);
    const shouldFetchNextPressId = searchParams.get('nextPressId') === 'true';
    const query = searchParams.get('q');

    if (shouldFetchNextPressId) {
      const pressId = await getNextPressIdPreview();
      const latestRecord = await Journalist.findOne({})
        .sort({ updatedAt: -1 })
        .select('layout')
        .lean();

      return NextResponse.json({
        pressId,
        lastSavedLayout: latestRecord?.layout || {}
      });
    }

    let filter = {};
    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { pressId: { $regex: query, $options: 'i' } },
          { area: { $regex: query, $options: 'i' } }
        ]
      };
    }

    const journalists = await Journalist.find(filter).sort({ createdAt: -1 });
    const payload = await Promise.all(
      journalists.map(async (j) => withVerificationMeta(await withDisplayImages(j), origin))
    );
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journalists' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const origin = new URL(request.url).origin;
    const data = await request.json();
    const { _id, pressId: _ignoredPressId, adminPassword, ...payload } = data;
    const profileImage = await uploadImageIfBase64(payload.profileImage, 'journalists/profile');
    const signatureImage = await uploadImageIfBase64(payload.signatureImage, 'journalists/signature');
    const normalizedPayload = {
      ...payload,
      profileImage,
      signatureImage
    };

    if (_id) {
      const existing = await Journalist.findById(_id);
      if (!existing) {
        return NextResponse.json({ error: 'Journalist not found' }, { status: 404 });
      }

      if (isProtectedCard(existing.pressId) && !isValidMasterPassword(adminPassword)) {
        return NextResponse.json({ error: 'Invalid secret password for protected ID' }, { status: 403 });
      }

      if (!existing.cardId || !existing.qrSignature) {
        const cardId = generateCardId();
        existing.cardId = cardId;
        existing.qrSignature = signCardPayload(cardId, existing.pressId);
      }

      Object.assign(existing, normalizedPayload);
      const updated = await existing.save();

      if (!updated) {
        return NextResponse.json({ error: 'Journalist not found' }, { status: 404 });
      }

      const responseData = await withDisplayImages(updated);
      return NextResponse.json({
        message: 'Journalist updated successfully',
        data: withVerificationMeta(responseData, origin)
      });
    }

    const generatedPressId = await allocatePressId();
    const cardId = generateCardId();
    const qrSignature = signCardPayload(cardId, generatedPressId);
    const journalist = await Journalist.create({
      ...normalizedPayload,
      pressId: generatedPressId,
      cardId,
      qrSignature
    });
    const responseData = await withDisplayImages(journalist);
    return NextResponse.json({
      message: 'Journalist saved successfully',
      data: withVerificationMeta(responseData, origin)
    });
  } catch (error) {
    console.error('Save error:', error.message);
    return NextResponse.json({ 
      error: 'Failed to save journalist details', 
      details: error.message 
    }, { status: 500 });
  }
}
