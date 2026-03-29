import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', { expires: new Date(0), sameSite: 'none', secure: true });
  return NextResponse.json({ success: true });
}
