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

    const updatableFields = [
      'fullName', 'fatherName', 'dateOfBirth', 'gender', 'email', 'mobile',
      'emergencyContact', 'workLocation', 'area', 'bloodGroup', 'experienceYears',
      'aadhaarNumber', 'address', 'purpose', 'profileImage', 'signatureImage',
      'status', 'adminRemarks', 'approvedJournalistId'
    ];

    const updateData = {};
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await IdCardRequest.findByIdAndUpdate(
      id,
      updateData,
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
