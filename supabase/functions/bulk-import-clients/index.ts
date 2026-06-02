import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRow {
  couple_name: string;
  event_date: string;
  event_type: string;
  contact_email: string;
  venue?: string;
  coordinator_name?: string;
  package_type?: string;
  guest_count?: string | number;
  contact_phone?: string;
  bride_email?: string;
  groom_email?: string;
  notes?: string;
}

interface ImportResult {
  row: number;
  couple_name: string;
  success: boolean;
  wedding_id?: string;
  couple_code?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1)
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { rows }: { rows: ImportRow[] } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'No rows provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rows.length > 500) {
      return new Response(JSON.stringify({ error: 'Maximum 500 rows per import' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validEventTypes = ['wedding', 'quince', 'birthday', 'banquet', 'graduation', 'sweet16'];
    const results: ImportResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // Validation
      if (!row.couple_name?.trim()) {
        results.push({ row: rowNum, couple_name: row.couple_name || '', success: false, error: 'couple_name is required' });
        continue;
      }

      if (!row.event_date?.trim()) {
        results.push({ row: rowNum, couple_name: row.couple_name, success: false, error: 'event_date is required' });
        continue;
      }

      // Validate date
      const parsedDate = new Date(row.event_date);
      if (isNaN(parsedDate.getTime())) {
        results.push({ row: rowNum, couple_name: row.couple_name, success: false, error: `Invalid event_date: "${row.event_date}"` });
        continue;
      }

      const eventTypeLower = (row.event_type || '').toLowerCase().trim();
      if (!validEventTypes.includes(eventTypeLower)) {
        results.push({ row: rowNum, couple_name: row.couple_name, success: false, error: `Invalid event_type "${row.event_type}". Must be: wedding, quince, birthday, banquet, graduation, or sweet16` });
        continue;
      }

      // Email: require contact_email OR (bride_email or groom_email)
      const contactEmail = row.contact_email?.trim();
      const brideEmail = row.bride_email?.trim();
      const groomEmail = row.groom_email?.trim();
      const resolvedEmail = contactEmail || brideEmail || groomEmail;

      if (!resolvedEmail) {
        results.push({ row: rowNum, couple_name: row.couple_name, success: false, error: 'At least one email (contact_email, bride_email, or groom_email) is required' });
        continue;
      }

      // Format date as YYYY-MM-DD
      const formattedDate = parsedDate.toISOString().split('T')[0];

      const guestCount = row.guest_count ? parseInt(String(row.guest_count), 10) : null;

      try {
        const { data: weddingId, error: rpcError } = await adminClient.rpc('create_event_notification', {
          p_data: {
            couple_name: row.couple_name.trim(),
            event_date: formattedDate,
            event_type: eventTypeLower,
            contact_email: resolvedEmail,
            venue: row.venue?.trim() || null,
            coordinator_name: row.coordinator_name?.trim() || null,
            package_type: row.package_type?.trim() || null,
            guest_count: isNaN(guestCount!) ? null : guestCount,
            contact_phone: row.contact_phone?.trim() || null,
            bride_email: brideEmail || null,
            groom_email: groomEmail || null,
            notes: row.notes?.trim() || null,
            submitted_by: 'bulk_import',
            status: 'submitted',
            form_progress: 100,
            is_test: false,
          }
        });

        if (rpcError) throw rpcError;

        // Fetch the couple code that was auto-generated
        const { data: codeData } = await adminClient
          .from('couple_codes')
          .select('code')
          .eq('wedding_id', weddingId)
          .single();

        results.push({
          row: rowNum,
          couple_name: row.couple_name.trim(),
          success: true,
          wedding_id: weddingId,
          couple_code: codeData?.code,
        });
      } catch (err: any) {
        results.push({
          row: rowNum,
          couple_name: row.couple_name,
          success: false,
          error: err.message || 'Database error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ results, summary: { total: rows.length, success: successCount, failed: failCount } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
