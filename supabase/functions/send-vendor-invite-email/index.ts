import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { VendorInviteEmail } from '../_shared/email-templates.tsx';
import { htmlToPlainText } from '../_shared/htmlToText.ts';
import { redactEmail, safeLogger } from '../_shared/validators.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VendorInviteEmailRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  vendorType: string;
  code: string;
  registrationLink: string;
  expiresAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      firstName,
      lastName,
      companyName,
      vendorType,
      code,
      registrationLink,
      expiresAt,
    }: VendorInviteEmailRequest = await req.json();

    safeLogger.info("[VENDOR-INVITE] Sending invite", { email: redactEmail(email), vendorType });

    const recipientName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : firstName || companyName || email;

    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(VendorInviteEmail, {
        recipientName,
        companyName,
        vendorType,
        code,
        registrationLink,
        expiryDate,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3.com>",
      to: [email],
      subject: "Welcome to Enzym3 Entertainment - Your Vendor Invitation",
      html,
      text: htmlToPlainText(html),
    });

    safeLogger.info("[VENDOR-INVITE] Email sent successfully", { id: emailResponse?.data?.id });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[VENDOR-INVITE] Error sending email:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to send invite email' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
