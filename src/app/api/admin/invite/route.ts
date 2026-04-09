import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email, full_name, role, verticals, password, form_responses } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Verify caller is super_admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can invite users' }, { status: 403 });
    }

    // Create invitation record
    const { error: inviteRecordError } = await supabase.from('invitations').insert({
      email,
      full_name: full_name || '',
      role: role || 'candidate',
      invited_by: user.id,
      verticals: verticals || [],
    });

    if (inviteRecordError) {
      return NextResponse.json({ error: inviteRecordError.message }, { status: 500 });
    }

    // Create user with password using admin client
    const adminClient = createAdminClient();
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: role || 'candidate' },
    });

    if (authError) {
      return NextResponse.json({ error: `User creation failed: ${authError.message}` }, { status: 500 });
    }

    // Store form_responses if provided
    if (form_responses && newUser?.user) {
      const adminSupabase = createAdminClient();
      await adminSupabase.from('profiles').update({ form_responses }).eq('id', newUser.user.id);
    }

    return NextResponse.json({
      success: true,
      message: `User created. They can sign in with email: ${email} and the password you set.`,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
