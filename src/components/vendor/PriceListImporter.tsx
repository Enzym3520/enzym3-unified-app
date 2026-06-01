import { useState, useRef } from "react";
import { Upload, FileText, Loader2, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ParsedItem {
  name: string;
  price: number;
  type: "package" | "addon";
  features: string[];
}

interface PriceListImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: ParsedItem[]) => void;
}

export const PriceListImporter = ({ open, onOpenChange, onImport }: PriceListImporterProps) => {
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setRawText(""); setFile(null); setParsing(false); setParsedItems(null); };
  const handleClose = (val: boolean) => { if (!val) reset(); onOpenChange(val); };

  const toBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleParse = async () => {
    setParsing(true);
    try {
      let body: Record<string, unknown> = {};
      if (file) {
        body = { fileBase64: await toBase64(file), mimeType: file.type };
      } else if (rawText.trim()) {
        body = { text: rawText.trim() };
      } else {
        toast.error("Paste some text or upload a file first");
        setParsing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("parse-price-list", { body });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setParsing(false); return; }

      const items: ParsedItem[] = (data?.items || []).map((item: any) => ({
        name: item.name || "Unnamed",
        price: Number(item.price) || 0,
        type: item.type === "package" ? "package" : "addon",
        features: Array.isArray(item.features) ? item.features : [],
      }));

      if (items.length === 0) { toast.error("No items detected. Try pasting clearer text."); setParsing(false); return; }
      setParsedItems(items);
    } catch (err: any) {
      console.error("Parse error:", err);
      toast.error(err.message || "Failed to parse price list");
    } finally {
      setParsing(false);
    }
  };

  const updateItem = (index: number, updates: Partial<ParsedItem>) => {
    setParsedItems(prev => prev ? prev.map((item, i) => (i === index ? { ...item, ...updates } : item)) : prev);
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev ? prev.filter((_, i) => i !== index) : prev);
  };

  const handleImport = () => {
    if (!parsedItems || parsedItems.length === 0) return;
    onImport(parsedItems);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import Price List</DialogTitle></DialogHeader>

        {!parsedItems ? (
          <>
            <Tabs defaultValue="paste">
              <TabsList className="w-full">
                <TabsTrigger value="paste" className="flex-1"><FileText className="w-4 h-4 mr-2" />Paste Text</TabsTrigger>
                <TabsTrigger value="upload" className="flex-1"><Upload className="w-4 h-4 mr-2" />Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="space-y-3 mt-4">
                <Label>Paste your price list, menu, or rate sheet</Label>
                <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder={"Gold Package - $1,500\n4 hours DJ, MC services, Uplighting\n\nPlatinum Package - $2,500\n6 hours DJ, MC, Cold sparks\n\nExtra Hour - $200"} rows={10} className="font-mono text-sm" />
              </TabsContent>
              <TabsContent value="upload" className="space-y-3 mt-4">
                <Label>Upload a PDF, image, or screenshot of your price list</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }} onClick={() => fileInputRef.current?.click()}>
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium">{file.name}</span>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drop a file here or click to browse</p>
                      <p className="text-xs text-muted-foreground">PDF, PNG, JPG — up to 10MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={handleParse} disabled={parsing || (!rawText.trim() && !file)}>
                {parsing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing…</> : "Parse Price List"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{parsedItems.length} item{parsedItems.length !== 1 ? "s" : ""} detected. Review and edit before importing.</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {parsedItems.map((item, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder="Name" className="flex-1" />
                        <Input type="number" value={item.price} onChange={(e) => updateItem(i, { price: Number(e.target.value) })} className="w-28" step="0.01" />
                        <Select value={item.type} onValueChange={(v) => updateItem(i, { type: v as "package" | "addon" })}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="package">Package</SelectItem>
                            <SelectItem value="addon">Add-On</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {item.type === "package" && item.features.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.features.map((f, fi) => <Badge key={fi} variant="secondary" className="text-xs">{f}</Badge>)}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setParsedItems(null)}>Back</Button>
              <Button onClick={handleImport} disabled={parsedItems.length === 0}>Import {parsedItems.length} Item{parsedItems.length !== 1 ? "s" : ""}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
