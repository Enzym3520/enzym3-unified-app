import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Sparkles, ChevronRight, ChevronLeft, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

type Upgrade = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
};

type WizardStep = 1 | 2 | 3;

const EMPTY_FORM = { name: '', price: '', description: '' };

export default function UpgradesManagement() {
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('upgrades')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) toast.error('Failed to load upgrades');
    else setUpgrades(data as Upgrade[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStep(1);
    setWizardOpen(true);
  };

  const openEdit = (u: Upgrade) => {
    setEditingId(u.id);
    setForm({ name: u.name, price: String(u.price), description: u.description ?? '' });
    setStep(1);
    setWizardOpen(true);
  };

  const handleSave = async () => {
    const price = parseFloat(form.price);
    if (!form.name.trim() || isNaN(price) || price < 0) {
      toast.error('Name and a valid price are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('upgrades')
          .update({ name: form.name.trim(), price, description: form.description.trim() || null })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Upgrade updated');
      } else {
        const { error } = await supabase
          .from('upgrades')
          .insert({ name: form.name.trim(), price, description: form.description.trim() || null });
        if (error) throw error;
        toast.success('Upgrade added — clients can see it now');
      }
      setWizardOpen(false);
      load();
    } catch {
      toast.error('Failed to save upgrade');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('upgrades').delete().eq('id', deleteId);
    if (error) toast.error('Failed to delete upgrade');
    else { toast.success('Upgrade removed'); load(); }
    setDeleting(false);
    setDeleteId(null);
  };

  const canAdvance = () => {
    if (step === 1) return form.name.trim().length > 0 && form.price.trim().length > 0 && !isNaN(parseFloat(form.price));
    return true;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Upgrades
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add and manage the à la carte upgrades clients can select in their portal.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Upgrade
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : upgrades.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No upgrades yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Add your first upgrade and it'll appear in the client portal immediately.</p>
            <Button onClick={openAdd} variant="outline" className="mt-5 gap-2">
              <Plus className="h-4 w-4" /> Add Your First Upgrade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {upgrades.map((u) => (
            <Card key={u.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{u.name}</span>
                    <Badge variant="outline" className="shrink-0">
                      ${parseFloat(String(u.price)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </Badge>
                  </div>
                  {u.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{u.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add / Edit Wizard ── */}
      <Dialog open={wizardOpen} onOpenChange={(o) => { if (!saving) setWizardOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Upgrade' : 'Add New Upgrade'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the details for this upgrade.' : 'This upgrade will appear in the client portal immediately after saving.'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 py-1">
            {([1, 2, 3] as WizardStep[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${step === s ? 'bg-primary text-primary-foreground' : step > s ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={`h-px w-8 transition-colors ${step > s ? 'bg-primary/30' : 'bg-muted'}`} />}
              </div>
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              {step === 1 ? 'Name & Price' : step === 2 ? 'Description' : 'Review'}
            </span>
          </div>

          {/* Step 1: Name & Price */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Upgrade Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Cold Sparks, Photo Booth, LED Dance Floor"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Price <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Description <span className="text-muted-foreground text-xs">(optional but recommended)</span></Label>
                <textarea
                  rows={4}
                  placeholder="Describe what this upgrade adds to the event experience…"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Clients see this description when browsing upgrades.</p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="py-2 space-y-4">
              <Card className="bg-muted/40">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Upgrade</p>
                    <p className="font-semibold mt-0.5">{form.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Price</p>
                    <p className="font-semibold mt-0.5">${parseFloat(form.price || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  {form.description && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Description</p>
                      <p className="text-sm mt-0.5">{form.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground">
                Once saved, this upgrade will appear in the <strong>A La Carte</strong> section of every client's portal.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => step > 1 ? setStep((s) => (s - 1) as WizardStep) : setWizardOpen(false)}
              disabled={saving}
            >
              {step === 1 ? 'Cancel' : <><ChevronLeft className="h-4 w-4 mr-1" /> Back</>}
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => (s + 1) as WizardStep)} disabled={!canAdvance()}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editingId ? 'Save Changes' : 'Publish Upgrade'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!deleting) setDeleteId(o ? deleteId : null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Upgrade</DialogTitle>
            <DialogDescription>
              This upgrade will be removed from the client portal. Existing orders are not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
