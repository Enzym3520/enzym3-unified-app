import { useState, useEffect, useRef, useCallback, useMemo } from "react";

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "");
}
import { useEmailTemplate, useSaveEmailTemplate, EmailTemplate } from "@/hooks/use-email-template";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold, Italic, Underline, Link, List, ListOrdered, Save, Eye, Palette, Mail,
} from "lucide-react";

const MERGE_TAGS = ["{{client_name}}", "{{event_date}}", "{{event_type}}", "{{vendor_name}}"];
const SAMPLE_DATA: Record<string, string> = {
  "{{client_name}}": "Sarah & Mike",
  "{{event_date}}": "Saturday, June 14, 2026",
  "{{event_type}}": "wedding",
  "{{vendor_name}}": "Your Company",
};

function replaceMergeTags(text: string, vendorName?: string) {
  let result = text;
  for (const tag of MERGE_TAGS) {
    const val = tag === "{{vendor_name}}" && vendorName ? vendorName : SAMPLE_DATA[tag];
    result = result.split(tag).join(val);
  }
  return result;
}

function RichTextToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement> }) {
  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  return (
    <div className="flex items-center gap-1 border-b border-border p-2 bg-muted/30 rounded-t-md flex-wrap">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("bold")} title="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("italic")} title="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("underline")} title="Underline">
        <Underline className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-5 mx-1" />
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={insertLink} title="Insert Link">
        <Link className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("insertUnorderedList")} title="Bullet List">
        <List className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => exec("insertOrderedList")} title="Numbered List">
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-5 mx-1" />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto flex-wrap">
        {MERGE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className="px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-mono"
            onClick={() => exec("insertText", tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EmailTemplatePage() {
  const { data: existing, isLoading } = useEmailTemplate();
  const { data: profile } = useProfile();
  const saveMutation = useSaveEmailTemplate();
  const editorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    subject_template: "Welcome, {{client_name}}!",
    greeting: "Hey {{client_name}},",
    body_html: "<p>I'm excited to be part of your {{event_type}} on <strong>{{event_date}}</strong>. Let's make it amazing!</p>",
    cta_text: "Get Started",
    cta_url: "",
    signoff_text: "Looking forward to making this one special.",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
    brand_color: "#85D4FA",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        subject_template: existing.subject_template,
        greeting: existing.greeting,
        body_html: existing.body_html,
        cta_text: existing.cta_text,
        cta_url: existing.cta_url || "",
        signoff_text: existing.signoff_text,
        contact_name: existing.contact_name,
        contact_email: existing.contact_email,
        contact_phone: existing.contact_phone || "",
        logo_url: existing.logo_url || "",
        brand_color: existing.brand_color,
      });
    } else if (profile) {
      setForm((prev) => ({
        ...prev,
        contact_name: profile.company_name || `${profile.first_name} ${profile.last_name}`,
        contact_email: "",
        contact_phone: profile.phone || "",
      }));
    }
  }, [existing, profile]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== form.body_html) {
      editorRef.current.innerHTML = form.body_html;
    }
  }, [form.body_html]);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      setForm((prev) => ({ ...prev, body_html: editorRef.current!.innerHTML }));
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const plain = e.clipboardData.getData("text/plain");
    if (/<[a-z][\s\S]*>/i.test(plain)) {
      e.preventDefault();
      document.execCommand("insertHTML", false, plain);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const plain = e.dataTransfer.getData("text/plain");
    if (/<[a-z][\s\S]*>/i.test(plain)) {
      e.preventDefault();
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, plain);
    }
  }, []);

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const vendorName = profile?.company_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Your Company";

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 lg:grid-cols-2 mt-6">
          <Skeleton className="h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> Email Template
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize the welcome email template that's sent to your clients.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="mr-1.5 h-3.5 w-3.5" /> Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Content */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Email Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={form.subject_template}
                      onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                      placeholder="Welcome, {{client_name}}!"
                    />
                  </div>
                  <div>
                    <Label>Greeting</Label>
                    <Input
                      value={form.greeting}
                      onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                      placeholder="Hey {{client_name}},"
                    />
                  </div>
                  <div>
                    <Label>Body</Label>
                    <div className="border border-input rounded-md overflow-hidden">
                      <RichTextToolbar editorRef={editorRef as React.RefObject<HTMLDivElement>} />
                      <div
                        ref={editorRef}
                        contentEditable
                        className="min-h-[200px] p-3 text-sm focus:outline-none prose prose-sm max-w-none"
                        onInput={handleEditorInput}
                        onPaste={handlePaste}
                        onDrop={handleDrop}
                        suppressContentEditableWarning
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Sign-off</Label>
                    <Textarea
                      value={form.signoff_text}
                      onChange={(e) => setForm({ ...form, signoff_text: e.target.value })}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Call to Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Button Text</Label>
                    <Input
                      value={form.cta_text}
                      onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Button URL (optional)</Label>
                    <Input
                      value={form.cta_url}
                      onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Branding + Contact */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Brand Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.brand_color}
                        onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <Input
                        value={form.brand_color}
                        onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                        className="w-28 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Logo URL (optional)</Label>
                    <Input
                      value={form.logo_url}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      placeholder="https://your-logo.com/logo.png"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name / Company</Label>
                    <Input
                      value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone (optional)</Label>
                    <Input
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Merge tags:</strong> Use these in your subject, greeting, or body to personalize each email:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {MERGE_TAGS.map((tag) => (
                      <code key={tag} className="text-xs px-1.5 py-0.5 bg-background rounded border border-border font-mono">
                        {tag}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Subject: {replaceMergeTags(form.subject_template, vendorName)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="mx-auto max-w-[600px] rounded-xl overflow-hidden shadow-lg"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {/* Header */}
                <div
                  className="text-center p-8"
                  style={{ backgroundColor: form.brand_color + "30" }}
                >
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="h-12 mx-auto" />
                  ) : (
                    <div className="h-12 flex items-center justify-center text-lg font-semibold" style={{ color: form.brand_color }}>
                      {form.contact_name || vendorName}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="bg-white p-8 space-y-4 text-[15px] text-[#4b4540] leading-relaxed">
                  <p className="text-[#2D2921] font-medium">
                    {replaceMergeTags(form.greeting, vendorName)}
                  </p>

                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(replaceMergeTags(form.body_html, vendorName)),
                    }}
                  />

                  {form.cta_text && (
                    <div className="text-center py-4">
                      <span
                        className="inline-block px-8 py-3 rounded-full font-semibold text-white text-base"
                        style={{ backgroundColor: form.brand_color }}
                      >
                        {form.cta_text}
                      </span>
                    </div>
                  )}

                  <p>{replaceMergeTags(form.signoff_text, vendorName)}</p>

                  <hr className="border-[#e5e0d8]" />
                  <p className="text-[#2D2921] leading-loose text-sm">
                    <strong>{form.contact_name || vendorName}</strong>
                    {form.contact_email && (
                      <>
                        <br />
                        <span style={{ color: form.brand_color }}>{form.contact_email}</span>
                      </>
                    )}
                    {form.contact_phone && (
                      <>
                        <br />
                        {form.contact_phone}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
