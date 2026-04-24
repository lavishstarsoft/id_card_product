import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AppSettings from '@/lib/AppSettings';
import { uploadImageIfBase64, getDisplayImageUrl } from '@/lib/r2Upload';

const BRANDING_KEY = 'branding';

function defaults() {
  return {
    brandName: 'RK Vision News TV',
    dashboardTitle: 'Management Dashboard',
    applyTitle: 'Employee ID Card Application',
    adminLoginLabel: 'ADMIN LOGIN',
    logoUrl: '/logo.jpg'
  };
}

async function withDisplayLogo(doc) {
  const base = doc?.toObject ? doc.toObject() : doc;
  if (!base) return defaults();
  return {
    ...base,
    logoUrl: await getDisplayImageUrl(base.logoUrl || '/logo.jpg')
  };
}

export async function GET() {
  try {
    await dbConnect();
    let settings = await AppSettings.findOne({ key: BRANDING_KEY });
    if (!settings) {
      settings = await AppSettings.create({ key: BRANDING_KEY, ...defaults() });
    }
    const payload = await withDisplayLogo(settings);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(defaults());
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const logoUrl = body.logoUrl
      ? await uploadImageIfBase64(body.logoUrl, 'branding/logo')
      : undefined;

    const update = {
      ...(typeof body.brandName === 'string' ? { brandName: body.brandName.trim() } : {}),
      ...(typeof body.dashboardTitle === 'string' ? { dashboardTitle: body.dashboardTitle.trim() } : {}),
      ...(typeof body.applyTitle === 'string' ? { applyTitle: body.applyTitle.trim() } : {}),
      ...(typeof body.adminLoginLabel === 'string' ? { adminLoginLabel: body.adminLoginLabel.trim() } : {}),
      ...(logoUrl ? { logoUrl } : {})
    };

    const settings = await AppSettings.findOneAndUpdate(
      { key: BRANDING_KEY },
      { $set: update, $setOnInsert: { ...defaults(), key: BRANDING_KEY } },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: 'Brand settings updated',
      data: await withDisplayLogo(settings)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings', details: error.message }, { status: 500 });
  }
}
