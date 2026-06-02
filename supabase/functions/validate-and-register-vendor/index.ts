import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { 
  redactEmail, 
  redactName, 
  isValidEmail, 
  isValidName, 
  sanitizeString,
  getAuthorizedAdminEmails 
} from '../_shared/validators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RegisterRequest {
  code: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  equipmentNotes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      code,
      email,
      password,
      firstName,
      lastName,
      phone,
      companyName,
      equipmentNotes,
    }: RegisterRequest = await req.json();

    // Input validation
    if (!code || typeof code !== 'string' || code.length < 6 || code.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidName(firstName) || !isValidName(lastName)) {
      return new Response(
        JSON.stringify({ error: 'Invalid name format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || password.length < 8 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: 'Password must be between 8 and 128 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log with redacted PII
    console.log(`[VENDOR-REGISTER] Registration attempt for: ${redactEmail(email)}`);

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch and validate invite code
    const { data: inviteCode, error: fetchError } = await supabaseAdmin
      .from('dj_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (fetchError || !inviteCode) {
      console.log('[VENDOR-REGISTER] Invite code not found');
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate invite code status
    if (!inviteCode.active) {
      return new Response(
        JSON.stringify({ 
          error: 'This invite code has been deactivated',
          errorCode: 'invite_deactivated',
          suggestion: 'Please contact your administrator for a new invite',
          action: 'contact_admin'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (inviteCode.used_at) {
      return new Response(
        JSON.stringify({ 
          error: 'This invite code has already been used',
          errorCode: 'invite_already_used',
          suggestion: 'If you already registered, try logging in instead',
          action: 'login'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: 'This invite code has expired',
          errorCode: 'invite_expired',
          suggestion: 'Please contact your administrator for a new invite',
          action: 'contact_admin'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email matches invite
    if (inviteCode.invited_email && inviteCode.invited_email.toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ 
          error: 'Email does not match the invited email',
          errorCode: 'email_mismatch',
          suggestion: 'Please use the email address that received the invitation',
          action: 'retry'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[VENDOR-REGISTER] Invite code validated, creating user');

    // Check if this email is authorized for admin role (from env var)
    const authorizedAdminEmails = getAuthorizedAdminEmails();
    const isAuthorizedAdmin = authorizedAdminEmails.includes(email.toLowerCase());

    // Determine if this is a coordinator invite
    const isCoordinatorInvite = inviteCode.invited_role === 'coordinator';

    // Sanitize inputs
    const sanitizedFirstName = sanitizeString(firstName, 50);
    const sanitizedLastName = sanitizeString(lastName, 50);
    const sanitizedCompanyName = sanitizeString(companyName, 100);
    const sanitizedEquipmentNotes = sanitizeString(equipmentNotes, 500);
    const sanitizedPhone = sanitizeString(phone, 20);

    // Determine profile role
    const profileRole = isCoordinatorInvite ? 'coordinator' : 'vendor';

    // 3. Create auth user with auto-confirm
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        role: profileRole,
        vendor_type: isCoordinatorInvite ? null : (inviteCode.vendor_type || 'other'),
      },
    });

    if (authError || !authData.user) {
      console.error('[VENDOR-REGISTER] Error creating user:', authError?.code);
      
      let errorMessage = 'Failed to create user account';
      let errorCode = authError?.code || 'unknown';
      let suggestion = 'Please try again or contact support';
      let action: string | null = null;
      
      switch (errorCode) {
        case 'email_exists':
        case 'user_already_exists':
          errorMessage = 'This email is already registered';
          suggestion = 'If this is your account, please log in instead';
          action = 'login';
          break;
        case 'weak_password':
          errorMessage = 'Password is too weak';
          suggestion = 'Please use at least 8 characters with a mix of letters, numbers, and symbols';
          action = 'retry';
          break;
        case 'invalid_email':
          errorMessage = 'Invalid email address';
          suggestion = 'Please check your email and try again';
          action = 'retry';
          break;
        default:
          action = 'retry';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, errorCode, suggestion, action }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[VENDOR-REGISTER] User created: ${authData.user.id}`);

    // 4. Create profile entry
    // Parse multi-role from invite notes if present
    const vendorTypeValue = isCoordinatorInvite ? null : (inviteCode.vendor_type || 'other');
    let vendorTypesArray: string[] = [];
    if (!isCoordinatorInvite) {
      // Check if notes contain multi-role info
      const multiRoleMatch = inviteCode.notes?.match(/\[Multi-role: ([^\]]+)\]/);
      if (multiRoleMatch) {
        vendorTypesArray = multiRoleMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean);
      } else if (vendorTypeValue) {
        vendorTypesArray = [vendorTypeValue];
      }
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        phone: sanitizedPhone,
        company_name: sanitizedCompanyName || inviteCode.invited_company,
        equipment_notes: sanitizedEquipmentNotes,
        role: profileRole,
        vendor_type: vendorTypeValue,
        vendor_types: vendorTypesArray,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (profileError) {
      console.error('[VENDOR-REGISTER] Error creating profile:', profileError.code);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[VENDOR-REGISTER] Profile created');

    // 5. Create user_roles entry
    const roleValue = isAuthorizedAdmin ? 'admin' : isCoordinatorInvite ? 'moderator' : 'user';
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: roleValue,
      }, {
        onConflict: 'user_id,role',
        ignoreDuplicates: false,
      });

    if (roleError) {
      console.error('[VENDOR-REGISTER] Error creating user role:', roleError.code, roleError.message);
    }

    // 6. Mark invite as used
    const { error: updateError } = await supabaseAdmin
      .from('dj_codes')
      .update({
        used_by: authData.user.id,
        used_at: new Date().toISOString(),
        active: false,
      })
      .eq('id', inviteCode.id);

    if (updateError) {
      console.error('[VENDOR-REGISTER] Error updating invite code:', updateError.code);
    }

    console.log(`[VENDOR-REGISTER] Registration complete for: ${redactEmail(email)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration successful',
        userId: authData.user.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[VENDOR-REGISTER] Registration error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
