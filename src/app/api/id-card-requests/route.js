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

    const profileImage = await uploadImageIfBase64(body.profileImage, 'applications/profile');
    const signatureImage = await uploadImageIfBase64(body.signatureImage, 'applications/signature');

    const created = await IdCardRequest.create({
      ...body,
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
