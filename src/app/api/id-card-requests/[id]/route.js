import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import IdCardRequest from '@/lib/IdCardRequest';

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const allowedStatus = ['pending', 'approved', 'rejected'];
    if (body.status && !allowedStatus.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await IdCardRequest.findByIdAndUpdate(
      id,
      {
        ...(body.status ? { status: body.status } : {}),
        ...(typeof body.adminRemarks === 'string' ? { adminRemarks: body.adminRemarks } : {}),
        ...(typeof body.approvedJournalistId === 'string' ? { approvedJournalistId: body.approvedJournalistId } : {})
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Request updated', data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update request', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const deleted = await IdCardRequest.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete request', details: error.message }, { status: 500 });
  }
}
