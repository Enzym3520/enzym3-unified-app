import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  confirmationUrl: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, role }: ConfirmationEmailRequest = await req.json();

    if (!email || !confirmationUrl || !role) {
      console.error("Missing required fields:", { email: !!email, confirmationUrl: !!confirmationUrl, role: !!role });
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, confirmationUrl, or role" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const roleDisplay = role === 'coordinator' ? 'Event Planner' : 'DJ';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">Welcome to Enzym3 Entertainment!</h1>
          <div style="height: 3px; background: linear-gradient(90deg, #8B5CF6, #A855F7); margin: 20px auto; width: 100px;"></div>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;">
            Thank you for signing up as a <strong>${roleDisplay}</strong>!
          </p>
          
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Please confirm your email address to activate your account and access your dashboard.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: linear-gradient(135deg, #8B5CF6, #A855F7); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;
                      box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
              Confirm Email Address
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #8B5CF6; font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px;">
            ${confirmationUrl}
          </p>
        </div>
        
        <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.5;">
            <strong>Note:</strong> This confirmation link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Sent from Enzym3 Entertainment Event Management System
          </p>
        </div>
      </div>
    `;

    console.log("Sending confirmation email to:", email, "Role:", role);

    const emailResponse = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3.com>",
      to: [email],
      subject: "Confirm Your Email - Enzym3 Entertainment",
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-signup-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
