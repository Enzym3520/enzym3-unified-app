import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useContracts,
  useContractTemplates,
  useSaveContract,
  useSaveTemplate,
  useDeleteTemplate,
  useDeleteContract,
  useSendContract,
} from "@/hooks/use-contracts";
import { ContractStatusBadge } from "@/components/vendor/contracts/ContractStatusBadge";
import { ContractTemplateEditor } from "@/components/vendor/contracts/ContractTemplateEditor";
import { CreateContractDialog } from "@/components/vendor/contracts/CreateContractDialog";
import { ContractPreview } from "@/components/vendor/contracts/ContractPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/vendor/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, FileText, MoreVertical, Send, Eye, Trash2, Copy, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { ContractTemplate, Contract } from "@/hooks/use-contracts";

export default function ContractsPage() {
  const { data: contracts, isLoading: loadingContracts } = useContracts();
  const { data: templates, isLoading: loadingTemplates } = useContractTemplates();
  const saveContract = useSaveContract();
  const saveTemplate = useSaveTemplate();
  const deleteTemplate = useDeleteTemplate();
  const deleteContract = useDeleteContract();
  const sendContract = useSendContract();

  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "template" | "contract"; id: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open contract preview from ?id=<contract_id>
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || !contracts?.length || previewContract) return;
    const match = contracts.find((c) => c.id === id);
    if (match) {
      setPreviewContract(match);
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, contracts, previewContract, setSearchParams]);

  const filteredContracts = contracts?.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.signer_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "template") deleteTemplate.mutate(deleteTarget.id);
    else deleteContract.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const copySignLink = (token: string) => {
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground text-sm">Create, send, and track client contracts.</p>
        </div>
        <Button onClick={() => setShowCreateContract(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> New Contract
        </Button>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* ── Contracts Tab ── */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by title or client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingContracts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : !filteredContracts?.length ? (
            <EmptyState icon={FileText} title="No contracts yet" description="Create your first contract to get started." />
          ) : (
            <div className="space-y-3">
              {filteredContracts.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{c.title}</span>
                        <ContractStatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.signer_name ?? "No client"} {c.signer_email ? `· ${c.signer_email}` : ""}
                        {c.event ? ` · ${c.event.couple_name} (${c.event.event_date})` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(c.created_at), "MMM d, yyyy")}
                        {c.signed_at && ` · Signed ${format(new Date(c.signed_at), "MMM d, yyyy")}`}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewContract(c)}>
                          <Eye className="h-4 w-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        {c.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => sendContract.mutate(c.id)}
                            disabled={!c.signer_email}
                          >
                            <Send className="h-4 w-4 mr-2" /> Send to Client
                          </DropdownMenuItem>
                        )}
                        {c.status !== "draft" && (
                          <DropdownMenuItem onClick={() => copySignLink(c.sign_token)}>
                            <Copy className="h-4 w-4 mr-2" /> Copy Sign Link
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget({ type: "contract", id: c.id })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Templates Tab ── */}
        <TabsContent value="templates" className="space-y-4">
          <Button
            variant="outline"
            onClick={() => { setEditingTemplate(null); setShowTemplateEditor(true); }}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> New Template
          </Button>

          {loadingTemplates ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : !templates?.length ? (
            <EmptyState icon={FileText} title="No templates" description="Create a reusable contract template." />
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{t.name}</span>
                      {t.is_default && <span className="ml-2 text-xs text-primary font-medium">Default</span>}
                      <p className="text-xs text-muted-foreground">
                        Updated {format(new Date(t.updated_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setEditingTemplate(t); setShowTemplateEditor(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setDeleteTarget({ type: "template", id: t.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ContractTemplateEditor
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        template={editingTemplate}
        onSave={(d) => { saveTemplate.mutate(d); setShowTemplateEditor(false); }}
        saving={saveTemplate.isPending}
      />

      <CreateContractDialog
        open={showCreateContract}
        onOpenChange={setShowCreateContract}
        onSave={(d) => { saveContract.mutate(d); setShowCreateContract(false); }}
        saving={saveContract.isPending}
      />

      {previewContract && (
        <ContractPreview
          open={!!previewContract}
          onOpenChange={() => setPreviewContract(null)}
          title={previewContract.title}
          html={previewContract.body_html}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
