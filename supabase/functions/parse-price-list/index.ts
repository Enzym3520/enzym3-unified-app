import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a price list parser. Extract service offerings from the provided text or document.

For each item found, determine:
- name: the service/package name
- price: numeric price (no currency symbols)
- type: "package" if it includes multiple features/services bundled together, "addon" if it's a single extra item
- features: array of included items/features (empty array for add-ons)

Return ONLY a JSON object with this exact structure:
{"items": [{"name": "...", "price": 1500, "type": "package", "features": ["feature1", "feature2"]}, ...]}

Rules:
- If a line has a name and price but the next lines list what's included (comma-separated or bullet points), it's a package with features.
- Single-line items with just a name and price are add-ons.
- Strip currency symbols and commas from prices.
- If you can't determine the price, use 0.
- Always return valid JSON, nothing else.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — prevent anonymous LLM credit burning
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Dynamic import to avoid top-level Deno compatibility issues
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await req.json();
    const { text, fileBase64, mimeType } = body;

    if (!text && !fileBase64) {
      return new Response(
        JSON.stringify({ error: "Provide either 'text' or 'fileBase64'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (fileBase64) {
      // Use vision: send image/pdf as base64
      const mediaType = mimeType || "image/png";
      
      // For PDFs, instruct AI to read it as text
      if (mediaType === "application/pdf") {
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all service offerings, packages, and add-ons with their prices from this document. Return structured JSON.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${fileBase64}`,
              },
            },
          ],
        });
      } else {
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all service offerings, packages, and add-ons with their prices from this image. Return structured JSON.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${fileBase64}`,
              },
            },
          ],
        });
      }
    } else {
      messages.push({
        role: "user",
        content: `Extract all service offerings, packages, and add-ons with their prices from this text:\n\n${text}`,
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Lovable settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to parse price list" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "Could not parse the price list. Try pasting cleaner text.", raw: content }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("parse-price-list error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
