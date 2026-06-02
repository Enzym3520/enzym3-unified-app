import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { redactEmail, isValidEmail, sanitizeString } from '../_shared/validators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRow {
  email: string;
  firstName?: string;
  lastName?: string;
  vendorType: string;
  companyName?: string;
  expiresInDays?: number;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // ── Auth: require admin or moderator role ─────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin', 'moderator'])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin or moderator access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BULK-INVITES] Authorized user ${user.id} (${roleData.role})`);

    // ── Business logic ────────────────────────────────────────────
    const { invites }: { invites: InviteRow[] } = await req.json();

    console.log(`[BULK-INVITES] Processing ${invites.length} bulk invites`);

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    };

    for (const invite of invites) {
      try {
        if (!isValidEmail(invite.email)) {
          results.failed.push({
            email: redactEmail(invite.email),
            error: 'Invalid email format',
          });
          continue;
        }

        const sanitizedEmail = invite.email.toLowerCase().trim();
        const sanitizedFirstName = sanitizeString(invite.firstName, 50);
        const sanitizedLastName = sanitizeString(invite.lastName, 50);
        const sanitizedCompanyName = sanitizeString(invite.companyName, 100);
        const sanitizedVendorType = sanitizeString(invite.vendorType, 50) || 'other';

        const { data: existingInvite } = await supabaseClient
          .from('dj_codes')
          .select('*')
          .eq('invited_email', sanitizedEmail)
          .eq('active', true)
          .is('used_at', null)
          .maybeSingle();

        if (existingInvite) {
          results.skipped.push({
            email: redactEmail(sanitizedEmail),
            reason: 'Already has active invite code',
          });
          continue;
        }

        const { data: existingUser } = await supabaseClient
          .from('profiles')
          .select('id, email')
          .eq('email', sanitizedEmail)
          .maybeSingle();

        if (existingUser) {
          results.skipped.push({
            email: redactEmail(sanitizedEmail),
            reason: 'User already registered',
          });
          continue;
        }

        let code = generateInviteCode();
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          const { data: existing } = await supabaseClient
            .from('dj_codes')
            .select('code')
            .eq('code', code)
            .maybeSingle();

          if (!existing) {
            isUnique = true;
          } else {
            code = generateInviteCode();
            attempts++;
          }
        }

        if (!isUnique) {
          results.failed.push({
            email: redactEmail(sanitizedEmail),
            error: 'Failed to generate unique code',
          });
          continue;
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (invite.expiresInDays || 30));

        const { data: newInvite, error: insertError } = await supabaseClient
          .from('dj_codes')
          .insert({
            code,
            invited_email: sanitizedEmail,
            invited_first_name: sanitizedFirstName,
            invited_last_name: sanitizedLastName,
            invited_company: sanitizedCompanyName,
            invited_role: 'vendor',
            vendor_type: sanitizedVendorType,
            expires_at: expiresAt.toISOString(),
            active: true,
            email: sanitizedEmail,
            name: `${sanitizedFirstName || ''} ${sanitizedLastName || ''}`.trim() || sanitizedEmail,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[BULK-INVITES] Insert error:', insertError.code);
          throw insertError;
        }

        results.successful.push({
          email: redactEmail(sanitizedEmail),
          code,
          registrationLink: `https://coordination.enzym3entertainment.vip/vendor-register?code=${code}`,
          fallbackLink: `https://e3ecoordination.lovable.app/vendor-register?code=${code}`,
        });

        console.log(`[BULK-INVITES] Created invite for ${redactEmail(sanitizedEmail)}: ${code}`);
      } catch (error) {
        console.error(`[BULK-INVITES] Error processing invite:`, (error as Error).message);
        results.failed.push({
          email: redactEmail(invite.email),
          error: 'Processing error',
        });
      }
    }

    // Send webhook notification with results (no PII in webhook)
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bulk_vendor_invites',
            timestamp: new Date().toISOString(),
            summary: {
              total: invites.length,
              successful: results.successful.length,
              failed: results.failed.length,
              skipped: results.skipped.length,
            },
            successfulCodes: results.successful.map(r => r.code),
          }),
        });
        console.log('[BULK-INVITES] Webhook sent successfully');
      } catch (webhookError) {
        console.error('[BULK-INVITES] Webhook error');
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BULK-INVITES] Bulk invite error:', (error as Error).message);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
