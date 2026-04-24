import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Journalist from '@/lib/Journalist';

const PROTECTED_PRESS_ID = 'RKV00003';
const MASTER_CARD_PASSWORD = process.env.MASTER_CARD_PASSWORD || 'rkvision_master_003';

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const target = await Journalist.findById(id);

    if (!target) {
      return NextResponse.json({ error: 'Journalist not found' }, { status: 404 });
    }

    if (target.pressId === PROTECTED_PRESS_ID) {
      const providedPassword = request.headers.get('x-admin-password');
      if (String(providedPassword || '') !== MASTER_CARD_PASSWORD) {
        return NextResponse.json({ error: 'Invalid secret password for protected ID' }, { status: 403 });
      }
    }

    const deleted = await Journalist.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Journalist not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Journalist deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete journalist' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const shouldRevoke = body?.status === 'revoked';

    const updated = await Journalist.findByIdAndUpdate(
      id,
      {
        status: shouldRevoke ? 'revoked' : 'active',
        revokedAt: shouldRevoke ? new Date() : null
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Journalist not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: shouldRevoke ? 'Card revoked successfully' : 'Card activated successfully',
      data: updated
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update card status' }, { status: 500 });
  }
}
