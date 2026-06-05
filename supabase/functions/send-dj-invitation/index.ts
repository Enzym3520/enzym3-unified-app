import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  recipientEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
  invitationCode: string;
  inviterName: string;
  personalMessage?: string;
  role: 'dj' | 'vendor';
  companyName?: string;
}

const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check — require a valid JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const {
      recipientEmail,
      recipientFirstName,
      recipientLastName,
      invitationCode,
      inviterName,
      personalMessage,
      role,
      companyName
    }: InvitationRequest = await req.json();

    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'recipientEmail is required and must be a valid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Processing invitation for ${recipientEmail} with code ${invitationCode}`);

    // Construct the signup URL with invitation code
    const signupUrl = `https://plan.enzym3entertainment.vip/join/${encodeURIComponent(invitationCode)}`;

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .code { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
            .personal-message { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 You're Invited!</h1>
            </div>
            <div class="content">
              <h2>Hi ${recipientFirstName},</h2>
              <p><strong>${inviterName}</strong> has invited you to join Enzym3 Entertainment's Event Management Hub as a <strong>${role === 'dj' ? 'DJ' : 'Vendor'}</strong>.</p>

              ${personalMessage ? `
              <div class="personal-message">
                <p><strong>Personal message from ${inviterName}:</strong></p>
                <p>${esc(personalMessage ?? '')}</p>
              </div>
              ` : ''}

              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666;">Your Invitation Code:</p>
                <div class="code">${invitationCode}</div>
              </div>

              <p style="text-align: center;">
                <a href="${signupUrl}" class="button">Get Started →</a>
              </p>

              <p style="font-size: 14px; color: #666;">
                This invitation will expire in 30 days. If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${signupUrl}">${signupUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
      to: [recipientEmail],
      subject: `You're Invited to Join Enzym3 Event Management Hub`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the invitation activity
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        await supabase.from('action_logs').insert({
          wedding_id: null,
          step: 'invitation_sent',
          outcome: {
            inviter_id: user.id,
            inviter_name: inviterName,
            recipient_email: recipientEmail,
            recipient_name: `${recipientFirstName} ${recipientLastName}`,
            invitation_code: invitationCode,
            role: role,
            company_name: companyName || null,
          }
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent successfully",
        email_id: emailResponse.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-dj-invitation function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
