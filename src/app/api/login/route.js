import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/lib/Admin';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const fallbackOk = username === 'admin' && (password === 'admin123' || password === 'admin@123');

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    let dbAvailable = false;
    let hasAnyAdmin = false;

    // 1. Database Login Check
    try {
      await dbConnect();
      dbAvailable = true;
      hasAnyAdmin = Boolean(await Admin.exists({}));

      const admin = await Admin.findOne({ username });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET);
          const token = await new SignJWT({ id: admin._id, username: admin.username })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

          const response = NextResponse.json({ success: true, message: 'Login successful (DB)' });
          response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24,
            path: '/',
          });
          return response;
        }
      }
    } catch (dbError) {
      // Database connection error - silently falling back
    }

    // 2. Hardcoded fallback login (allowed only when DB is unavailable or no admin exists)
    if (fallbackOk && (!dbAvailable || !hasAnyAdmin)) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({ username: 'admin', role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

      const response = NextResponse.json({ success: true, message: 'Login successful (Local)' });
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
