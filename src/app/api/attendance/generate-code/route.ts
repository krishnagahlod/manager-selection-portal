import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ATTENDANCE_CODE_VALIDITY_SECONDS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'evaluator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate code via database function
    const { data: code, error } = await supabase.rpc('generate_attendance_code', {
      p_session_id: sessionId,
      p_validity_seconds: ATTENDANCE_CODE_VALIDITY_SECONDS,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
    }

    return NextResponse.json({
      code,
      validUntil: new Date(Date.now() + ATTENDANCE_CODE_VALIDITY_SECONDS * 1000).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
