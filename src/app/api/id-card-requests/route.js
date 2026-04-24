import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import IdCardRequest from '@/lib/IdCardRequest';
import { uploadImageIfBase64, getDisplayImageUrl } from '@/lib/r2Upload';

async function withDisplayImages(requestDoc) {
  const doc = requestDoc?.toObject ? requestDoc.toObject() : requestDoc;
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

export async function GET() {
  try {
    await dbConnect();
    const rows = await IdCardRequest.find({}).sort({ createdAt: -1 });
    const payload = await Promise.all(rows.map((row) => withDisplayImages(row)));
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch ID requests' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const normalizedMobile = String(body.mobile || '').trim();
    const normalizedEmail = String(body.email || '').trim().toLowerCase();

    if (!normalizedMobile) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const duplicateQuery = {
      $or: [
        { mobile: normalizedMobile },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
      ]
    };

    const existing = await IdCardRequest.findOne(duplicateQuery).select('mobile email').lean();
    if (existing) {
      if (existing.mobile === normalizedMobile) {
        return NextResponse.json({ error: 'This mobile number is already submitted' }, { status: 409 });
      }
      if (normalizedEmail && existing.email === normalizedEmail) {
        return NextResponse.json({ error: 'This email is already submitted' }, { status: 409 });
      }
    }

    const profileImage = await uploadImageIfBase64(body.profileImage, 'applications/profile');
    const signatureImage = await uploadImageIfBase64(body.signatureImage, 'applications/signature');

    const created = await IdCardRequest.create({
      ...body,
      mobile: normalizedMobile,
      email: normalizedEmail,
      profileImage,
      signatureImage
    });

    return NextResponse.json({
      message: 'Application submitted successfully',
      data: await withDisplayImages(created)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit application', details: error.message },
      { status: 500 }
    );
  }
}
