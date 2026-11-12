import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await query('SELECT user_id FROM USERS WHERE LOWER(email) = LOWER($1);', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    // Default role for self-registration is STUDENT
    const insertRes = await query(
      `INSERT INTO USERS (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'STUDENT')
       RETURNING user_id, name, email, role, created_at;`,
      [name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const newUser = insertRes.rows[0];
    const token = generateToken(newUser);

    const response = NextResponse.json({
      message: 'Registration successful.',
      user: newUser,
      token,
    }, { status: 201 });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error('[API Register Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

