import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/Admin';

const FALLBACK_ADMIN_USERNAME = 'admin';
const FALLBACK_PASSWORDS = ['admin123', 'admin@123'];

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
}

async function verifyCurrentCredentials(currentUsername, currentPassword) {
  await dbConnect();
  const admin = await Admin.findOne({ username: currentUsername });
  const hasAnyAdmin = Boolean(await Admin.exists({}));

  const fallbackOk =
    !hasAnyAdmin &&
    currentUsername === FALLBACK_ADMIN_USERNAME &&
    FALLBACK_PASSWORDS.includes(currentPassword);

  if (admin) {
    let ok = false;
    const storedPassword = String(admin.password || '');

    if (storedPassword) {
      if (isBcryptHash(storedPassword)) {
        ok = await bcrypt.compare(currentPassword, storedPassword);
      } else {
        ok = currentPassword === storedPassword;
        // One-time migration for plaintext password records.
        if (ok) {
          admin.password = await bcrypt.hash(currentPassword, 10);
          await admin.save();
        }
      }
    }

    // Match login behavior: fallback only when DB admin is not configured.
    if (!ok && fallbackOk) {
      return { ok: true, admin: null };
    }

    return { ok, admin };
  }

  return { ok: fallbackOk, admin: null };
}

export async function PUT(request) {
  try {
    const {
      action,
      currentUsername,
      currentPassword,
      newUsername,
      newPassword
    } = await request.json();

    if (!currentUsername || !currentPassword) {
      return NextResponse.json({ error: 'Current username and password are required' }, { status: 400 });
    }

    const { ok, admin } = await verifyCurrentCredentials(currentUsername, currentPassword);
    if (!ok) {
      return NextResponse.json({ error: 'Current username or password is invalid' }, { status: 401 });
    }

    await dbConnect();

    if (action === 'username') {
      if (!newUsername) {
        return NextResponse.json({ error: 'New username is required' }, { status: 400 });
      }

      const existingWithNewUsername = await Admin.findOne({ username: newUsername });
      if (existingWithNewUsername && String(existingWithNewUsername._id) !== String(admin?._id || '')) {
        return NextResponse.json({ error: 'New username is already in use' }, { status: 409 });
      }

      if (admin) {
        admin.username = newUsername;
        await admin.save();
      } else {
        await Admin.findOneAndUpdate(
          { username: currentUsername },
          { username: newUsername, password: await bcrypt.hash(currentPassword, 10) },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      }

      return NextResponse.json({ message: 'Username updated successfully' });
    }

    if (action === 'password') {
      if (!newPassword) {
        return NextResponse.json({ error: 'New password is required' }, { status: 400 });
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      if (admin) {
        admin.password = hashed;
        await admin.save();
      } else {
        await Admin.findOneAndUpdate(
          { username: currentUsername },
          { username: currentUsername, password: hashed },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      }

      return NextResponse.json({ message: 'Password updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update credentials', details: error.message }, { status: 500 });
  }
}
