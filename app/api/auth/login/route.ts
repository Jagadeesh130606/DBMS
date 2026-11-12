import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { comparePassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const res = await query(
      'SELECT user_id, name, email, password_hash, role, created_at FROM USERS WHERE LOWER(email) = LOWER($1);',
      [email.trim()]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const user = res.rows[0];
    const passwordValid = comparePassword(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials. Incorrect password.' }, { status: 401 });
    }

    const authUser = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(authUser);

    const response = NextResponse.json({
      message: 'Login successful.',
      user: authUser,
      token,
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error('[API Login Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

