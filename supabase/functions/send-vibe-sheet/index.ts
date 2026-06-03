import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import React from "https://esm.sh/react@18.3.1";
import { render } from "https://esm.sh/@react-email/render@0.0.12";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { VibeSheetEmail } from "./_templates/vibe-sheet-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  recipients: string[];
  ccCouple: boolean;
  coupleEmail?: string;
  coupleName: string;
  eventDate: string;
  eventLabel?: string;
  vibeSheetData: any;
  pdfBase64?: string;
  personalMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const {
      recipients,
      ccCouple,
      coupleEmail,
      coupleName,
      eventDate,
      eventLabel = "Wedding",
      vibeSheetData,
      pdfBase64,
      personalMessage,
    }: EmailRequest = await req.json();

    console.log("Sending vibe sheet email to:", recipients);

    if (!recipients || recipients.length === 0) {
      throw new Error("At least one recipient email is required");
    }

    const allRecipients = [...recipients];
    if (ccCouple && coupleEmail && !allRecipients.includes(coupleEmail)) {
      allRecipients.push(coupleEmail);
    }

    const html = render(
      React.createElement(VibeSheetEmail, {
        coupleName,
        eventDate,
        vibeSheetData,
        personalMessage,
      })
    );

    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: `${coupleName.replace(/[^a-z0-9]/gi, "_")}_VibeSheet.pdf`,
        content: pdfBase64,
      });
    }

    const emailResponse = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
      to: allRecipients,
      subject: `${eventLabel} Vibe Sheet - ${coupleName} (${eventDate})`,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.data?.id,
        recipients: allRecipients,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-vibe-sheet function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An internal error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
