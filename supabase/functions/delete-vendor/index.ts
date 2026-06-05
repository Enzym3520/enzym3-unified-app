import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'NO_AUTH' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required', code: 'NOT_ADMIN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { vendorId } = await req.json();
    if (!vendorId) {
      return new Response(
        JSON.stringify({ error: 'Vendor ID is required', code: 'MISSING_VENDOR_ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} attempting to delete vendor ${vendorId}`);

    // Check for active assignments
    const { data: activeAssignments, error: assignmentError } = await supabaseAdmin
      .from('event_dj_assignments')
      .select('id, status')
      .eq('dj_user_id', vendorId)
      .in('status', ['assigned', 'confirmed']);

    if (assignmentError) {
      console.error('Failed to check assignments:', assignmentError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to check vendor assignments', code: 'CHECK_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (activeAssignments && activeAssignments.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete vendor with active assignments. Please reassign or cancel events first.',
          code: 'HAS_ACTIVE_ASSIGNMENTS',
          assignmentCount: activeAssignments.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete related data in correct order to avoid FK violations
    const cleanupSteps = [
      // 1. user_roles
      () => supabaseAdmin.from('user_roles').delete().eq('user_id', vendorId),
      // 2. notifications
      () => supabaseAdmin.from('notifications').delete().eq('user_id', vendorId),
      // 3. push_subscriptions
      () => supabaseAdmin.from('push_subscriptions').delete().eq('user_id', vendorId),
      // 4. vendor_documents
      () => supabaseAdmin.from('vendor_documents').delete().eq('vendor_id', vendorId),
      // 5. vendor_availability_blocks
      () => supabaseAdmin.from('vendor_availability_blocks').delete().eq('vendor_id', vendorId),
      // 6. vendor_blackout_dates
      () => supabaseAdmin.from('vendor_blackout_dates').delete().eq('vendor_id', vendorId),
      // 7. vendor_stats
      () => supabaseAdmin.from('vendor_stats').delete().eq('vendor_id', vendorId),
      // 9. vendor_achievements
      () => supabaseAdmin.from('vendor_achievements').delete().eq('vendor_id', vendorId),
      // 10. vendor_reviews
      () => supabaseAdmin.from('vendor_reviews').delete().eq('vendor_id', vendorId),
      // 11. vendor_services
      () => supabaseAdmin.from('vendor_services').delete().eq('vendor_id', vendorId),
      // 12. Non-active event_dj_assignments (active ones already blocked above)
      () => supabaseAdmin.from('event_dj_assignments').delete().eq('dj_user_id', vendorId),
      // 13. assignment_costs via assignments - handled by cascade
      // 14. direct_messages (sender or recipient)
      () => supabaseAdmin.from('direct_messages').delete().eq('sender_id', vendorId),
      () => supabaseAdmin.from('direct_messages').delete().eq('recipient_id', vendorId),
      // 15. chat_messages (SET NULL for sender/recipient)
      () => supabaseAdmin.from('chat_messages').update({ sender_id: user.id }).eq('sender_id', vendorId),
      // 16. event_notification_history.assigned_vendor_id → SET NULL
      () => supabaseAdmin.from('event_notification_history').update({ assigned_vendor_id: null }).eq('assigned_vendor_id', vendorId),
      // 17. bookings (vendor_id)
      () => supabaseAdmin.from('bookings').update({ vendor_id: null }).eq('vendor_id', vendorId),
      // 18. booking_requests
      () => supabaseAdmin.from('booking_requests').delete().eq('vendor_id', vendorId),
      // 19. booking_invite_tokens
      () => supabaseAdmin.from('booking_invite_tokens').delete().eq('vendor_id', vendorId),
      // 20. dj_codes - clear used_by
      () => supabaseAdmin.from('dj_codes').update({ used_by: null, used_at: null }).eq('used_by', vendorId),
      // 21. vendor_pages
      () => supabaseAdmin.from('vendor_pages').delete().eq('vendor_id', vendorId),
      // 22. vendor_add_ons
      () => supabaseAdmin.from('vendor_add_ons').delete().eq('vendor_id', vendorId),
      // 23. vendor_packages
      () => supabaseAdmin.from('vendor_packages').delete().eq('vendor_id', vendorId),
    ];

    for (const step of cleanupSteps) {
      const { error } = await step();
      if (error) {
        console.error('Cleanup step error (continuing):', error.message);
        // Continue - table may not exist or no rows to delete
      }
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', vendorId);

    if (profileError) {
      console.error('Failed to delete profile:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to delete vendor profile', code: 'PROFILE_DELETE_FAILED' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(vendorId);
    if (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError.message);
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Profile deleted but auth user removal failed',
          code: 'PARTIAL_SUCCESS'
        }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted vendor ${vendorId}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
