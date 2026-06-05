import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Package, DollarSign, Layers, Upload } from "lucide-react";
import { PriceListImporter } from "@/components/vendor/PriceListImporter";
import { formatVendorType } from "@/utils/vendorHelpers";
import { toast } from "sonner";
import {
  useServices, usePackages, useAddOns,
  useSaveService, useDeleteService,
  useSavePackage, useDeletePackage,
  useSaveAddOn, useDeleteAddOn,
  type VendorService, type VendorPackage,
} from "@/hooks/use-services";

const SERVICE_TYPES = ["dj", "mc", "lighting", "photo_booth", "photography", "videography", "other"];
const RATE_TYPE_LABELS: Record<string, string> = { hourly: "Hourly", flat: "Flat", per_event: "Per Event" };
const RATE_TYPES = ["hourly", "flat", "per_event"];

export default function ServicesPage() {
  const { data: services = [], isLoading: loadingS } = useServices();
  const { data: packages = [], isLoading: loadingP } = usePackages();
  const { data: addOns = [], isLoading: loadingA } = useAddOns();
  const saveService = useSaveService();
  const deleteService = useDeleteService();
  const savePackage = useSavePackage();
  const deletePackage = useDeletePackage();
  const saveAddOn = useSaveAddOn();
  const deleteAddOn = useDeleteAddOn();
  const [importerOpen, setImporterOpen] = useState(false);

  const [serviceDialog, setServiceDialog] = useState(false);
  const [packageDialog, setPackageDialog] = useState(false);
  const [addOnDialog, setAddOnDialog] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);

  const [serviceForm, setServiceForm] = useState({ service_type: "", rate_type: "hourly", base_rate: 0, overtime_rate: 0, min_hours: 0, notes: "", is_active: true });
  const [packageForm, setPackageForm] = useState({ name: "", description: "", price: 0, features: "", is_active: true });
  const [addOnForm, setAddOnForm] = useState({ name: "", description: "", price: 0, is_active: true });

  const resetServiceForm = () => setServiceForm({ service_type: "", rate_type: "hourly", base_rate: 0, overtime_rate: 0, min_hours: 0, notes: "", is_active: true });

  const editService = (s: VendorService) => {
    setEditingServiceId(s.id);
    setServiceForm({ service_type: s.service_type, rate_type: s.rate_type, base_rate: s.base_rate, overtime_rate: s.overtime_rate ?? 0, min_hours: s.min_hours ?? 0, notes: s.notes ?? "", is_active: s.is_active });
    setServiceDialog(true);
  };

  const loading = loadingS || loadingP || loadingA;

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-80 mt-2" /></div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Services & Pricing</h1>
          <p className="text-muted-foreground mt-1">Manage your service offerings, packages, and add-ons.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setImporterOpen(true)}>
          <Upload className="h-4 w-4 mr-1" /> Import Price List
        </Button>
      </div>

      <PriceListImporter
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImport={(items) => {
          let pkgCount = 0;
          let addonCount = 0;
          items.forEach((item) => {
            if (item.type === "package") {
              pkgCount++;
              savePackage.mutate({ id: null, name: item.name, description: "", price: item.price, features: item.features.join("\n"), is_active: true });
            } else {
              addonCount++;
              saveAddOn.mutate({ id: null, name: item.name, description: "", price: item.price, is_active: true });
            }
          });
          toast.success(`Imported ${pkgCount} package(s) and ${addonCount} add-on(s)`);
        }}
      />

      {/* Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Services</CardTitle><CardDescription>Your base service rates.</CardDescription></div>
          <Dialog open={serviceDialog} onOpenChange={(o) => { setServiceDialog(o); if (!o) { setEditingServiceId(null); resetServiceForm(); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Service</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingServiceId ? "Edit" : "Add"} Service</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={serviceForm.service_type} onValueChange={(v) => setServiceForm({ ...serviceForm, service_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{formatVendorType(t)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate Type</Label>
                    <Select value={serviceForm.rate_type} onValueChange={(v) => setServiceForm({ ...serviceForm, rate_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RATE_TYPES.map((t) => <SelectItem key={t} value={t}>{RATE_TYPE_LABELS[t] ?? t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Base Rate ($)</Label><Input type="number" value={serviceForm.base_rate} onChange={(e) => setServiceForm({ ...serviceForm, base_rate: +e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Overtime Rate ($)</Label><Input type="number" value={serviceForm.overtime_rate} onChange={(e) => setServiceForm({ ...serviceForm, overtime_rate: +e.target.value })} /></div>
                  <div className="space-y-2"><Label>Min Hours</Label><Input type="number" value={serviceForm.min_hours} onChange={(e) => setServiceForm({ ...serviceForm, min_hours: +e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={serviceForm.notes} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={serviceForm.is_active} onCheckedChange={(v) => setServiceForm({ ...serviceForm, is_active: v })} /><Label>Active</Label></div>
                <Button onClick={() => saveService.mutate({ id: editingServiceId, ...serviceForm }, { onSuccess: () => { setServiceDialog(false); setEditingServiceId(null); resetServiceForm(); } })} disabled={saveService.isPending || !serviceForm.service_type} className="w-full">
                  {saveService.isPending ? "Saving..." : "Save Service"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {services.length === 0 && <p className="text-sm text-muted-foreground">No services added yet.</p>}
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{formatVendorType(s.service_type)}</span>
                    <Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">{s.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">${s.base_rate}/{RATE_TYPE_LABELS[s.rate_type] ?? s.rate_type}{s.overtime_rate ? ` · OT: $${s.overtime_rate}/hr` : ""}{s.min_hours ? ` · Min ${s.min_hours}h` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editService(s)} aria-label="Edit service"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteService.mutate(s.id)} aria-label="Delete service"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Packages</CardTitle><CardDescription>Bundled service packages for clients.</CardDescription></div>
          <Dialog open={packageDialog} onOpenChange={(o) => { setPackageDialog(o); if (!o) { setEditingPackageId(null); setPackageForm({ name: "", description: "", price: 0, features: "", is_active: true }); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Package</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingPackageId ? "Edit" : "Add"} Package</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Package Name</Label><Input value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} /></div>
                <div className="space-y-2"><Label>Price ($)</Label><Input type="number" value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: +e.target.value })} /></div>
                <div className="space-y-2"><Label>Features (one per line)</Label><Textarea value={packageForm.features} onChange={(e) => setPackageForm({ ...packageForm, features: e.target.value })} placeholder={"4 hours of DJ service\nMC included\nLighting setup"} /></div>
                <div className="flex items-center gap-2"><Switch checked={packageForm.is_active} onCheckedChange={(v) => setPackageForm({ ...packageForm, is_active: v })} /><Label>Active</Label></div>
                <Button onClick={() => savePackage.mutate({ id: editingPackageId, ...packageForm }, { onSuccess: () => { setPackageDialog(false); setEditingPackageId(null); setPackageForm({ name: "", description: "", price: 0, features: "", is_active: true }); } })} disabled={savePackage.isPending || !packageForm.name} className="w-full">
                  {savePackage.isPending ? "Saving..." : "Save Package"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {packages.length === 0 && <p className="text-sm text-muted-foreground">No packages added yet.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div><h3 className="font-semibold">{p.name}</h3><p className="text-lg font-bold text-primary">${p.price}</p></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPackageId(p.id); setPackageForm({ name: p.name, description: p.description ?? "", price: p.price, features: (p.features ?? []).join("\n"), is_active: p.is_active ?? true }); setPackageDialog(true); }} aria-label="Edit package"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deletePackage.mutate(p.id)} aria-label="Delete package"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                {p.features && p.features.length > 0 && (
                  <ul className="text-sm space-y-1">{p.features.map((f, i) => <li key={i} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{f}</li>)}</ul>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Add-ons</CardTitle><CardDescription>Additional services clients can add.</CardDescription></div>
          <Dialog open={addOnDialog} onOpenChange={(o) => { setAddOnDialog(o); if (!o) { setEditingAddOnId(null); setAddOnForm({ name: "", description: "", price: 0, is_active: true }); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add-on</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingAddOnId ? "Edit" : "Add"} Add-on</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={addOnForm.name} onChange={(e) => setAddOnForm({ ...addOnForm, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={addOnForm.description} onChange={(e) => setAddOnForm({ ...addOnForm, description: e.target.value })} /></div>
                <div className="space-y-2"><Label>Price ($)</Label><Input type="number" value={addOnForm.price} onChange={(e) => setAddOnForm({ ...addOnForm, price: +e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={addOnForm.is_active} onCheckedChange={(v) => setAddOnForm({ ...addOnForm, is_active: v })} /><Label>Active</Label></div>
                <Button onClick={() => saveAddOn.mutate({ id: editingAddOnId, ...addOnForm }, { onSuccess: () => { setAddOnDialog(false); setEditingAddOnId(null); setAddOnForm({ name: "", description: "", price: 0, is_active: true }); } })} disabled={saveAddOn.isPending || !addOnForm.name} className="w-full">
                  {saveAddOn.isPending ? "Saving..." : "Save Add-on"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {addOns.length === 0 && <p className="text-sm text-muted-foreground">No add-ons yet.</p>}
          <div className="space-y-3">
            {addOns.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <span className="font-medium text-sm">{a.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">${a.price}</span>
                  {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAddOnId(a.id); setAddOnForm({ name: a.name, description: a.description ?? "", price: a.price, is_active: a.is_active ?? true }); setAddOnDialog(true); }} aria-label="Edit add-on"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteAddOn.mutate(a.id)} aria-label="Delete add-on"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
