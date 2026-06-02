import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { safeLogger, redactEmail, redactName } from "../_shared/validators.ts";

/**
 * OpenAI API key is accessed via Deno.env.get() which is the standard and
 * recommended pattern for Supabase Edge Functions. The key is stored in
 * Supabase Edge Function secrets (not hardcoded), making this secure.
 * See: https://supabase.com/docs/guides/functions/secrets
 */
const openAIApiKey = Deno.env.get('Openai_Key');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateMessageRequest {
  reminder: {
    id: string;
    contact_name: string;
    contact_email: string;
    reminder_type: 'pre_wedding' | 'post_wedding' | 'anniversary' | 'business_development' | 'custom';
    scheduled_date: string;
    event_context?: Record<string, any>;
    notes?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token using dynamic import
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      safeLogger.error('Auth error', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1)
      .maybeSingle();

    if (!userRoles) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check API key presence without logging its value
    if (!openAIApiKey) {
      safeLogger.error('OpenAI API key not configured - key present: false');
      throw new Error('OpenAI API key not configured');
    }
    safeLogger.info('OpenAI API key configured - key present: true');

    const { reminder }: GenerateMessageRequest = await req.json();

    // Log reminder details with PII redacted
    safeLogger.info('Generating reminder message', {
      reminderId: reminder.id,
      reminderType: reminder.reminder_type,
      scheduledDate: reminder.scheduled_date,
      hasEventContext: !!reminder.event_context,
      hasNotes: !!reminder.notes
    });

    // Create a personalized prompt based on reminder type and context
    const systemPrompt = getSystemPrompt(reminder.reminder_type);
    const userPrompt = buildUserPrompt(reminder);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      safeLogger.error('OpenAI API error', error);
      throw new Error('Failed to generate message');
    }

    const data = await response.json();
    const generatedMessage = data.choices[0].message.content;

    safeLogger.info('Message generated successfully', {
      reminderId: reminder.id,
      messageLength: generatedMessage?.length || 0
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: generatedMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    safeLogger.error('Error in generate-reminder-message function', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'An error occurred processing your request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSystemPrompt(reminderType: string): string {
  const basePrompt = "You are a professional wedding and event coordinator assistant. Create warm, personal, and professional messages for client follow-ups. ";
  
  switch (reminderType) {
    case 'pre_wedding':
      return basePrompt + "Create a pre-wedding check-in message that expresses excitement for their upcoming day, offers final assistance, and ensures everything is ready. Keep it supportive and reassuring.";
    
    case 'post_wedding':
      return basePrompt + "Create a post-wedding thank you message that expresses gratitude for choosing our services, hopes their day was perfect, and subtly encourages feedback or referrals. Keep it heartfelt and genuine.";
    
    case 'anniversary':
      return basePrompt + "Create a wedding anniversary message that celebrates their milestone, shares in their joy, and subtly mentions our services for future celebrations. Keep it celebratory and warm.";
    
    case 'business_development':
      return basePrompt + "Create a friendly business development message that checks in on their life, asks about potential referrals, and mentions our services naturally. Keep it relationship-focused, not sales-heavy.";
    
    default:
      return basePrompt + "Create a personalized message that maintains the professional relationship and offers continued support.";
  }
}

function buildUserPrompt(reminder: any): string {
  // Note: This function builds prompts containing PII which is necessary for 
  // AI personalization. The PII is NOT logged - only sent to OpenAI.
  let prompt = `Create a personalized message for ${reminder.contact_name}.`;
  
  if (reminder.event_context) {
    const context = reminder.event_context;
    if (context.event_date) {
      prompt += ` Their event was/is on ${context.event_date}.`;
    }
    if (context.venue) {
      prompt += ` The venue was/is ${context.venue}.`;
    }
    if (context.package_type) {
      prompt += ` They have/had the ${context.package_type} package.`;
    }
    if (context.years_married) {
      prompt += ` They are celebrating ${context.years_married} year(s) of marriage.`;
    }
  }
  
  if (reminder.notes) {
    prompt += ` Additional context: ${reminder.notes}`;
  }
  
  prompt += " The message should be 100-150 words, professional yet warm, and include a clear call-to-action or next step.";
  
  return prompt;
}
