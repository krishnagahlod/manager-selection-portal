import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { sessionId, code } = await request.json();

    if (!sessionId || !code || code.length !== 6) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Call the database function to validate and mark attendance
    const { data, error } = await supabase.rpc('mark_attendance', {
      p_session_id: sessionId,
      p_candidate_id: user.id,
      p_code: code,
    });

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to verify code' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
