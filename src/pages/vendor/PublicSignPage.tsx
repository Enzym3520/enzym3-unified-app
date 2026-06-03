import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicContract, useSignContract } from "@/hooks/use-contracts";
import { SignaturePad } from "@/components/vendor/contracts/SignaturePad";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import DOMPurify from "dompurify";

export default function PublicSignPage() {
  const { id: token } = useParams<{ id: string }>();
  const { data: contract, isLoading, error } = usePublicContract(token);
  const signMutation = useSignContract();

  const [signerName, setSignerName] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center mt-20">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Contract Not Found</h1>
        <p className="text-muted-foreground">This contract link may have expired or is no longer available.</p>
      </div>
    );
  }

  if (contract.status === "signed" || signed) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center mt-20">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Contract Signed</h1>
        <p className="text-muted-foreground">Thank you! The contract has been signed successfully.</p>
      </div>
    );
  }

  const handleSign = async () => {
    if (!signerName.trim() || !signatureData || !agreed) return;
    await signMutation.mutateAsync({
      contractId: contract.id,
      signToken: token!,
      signerName: signerName.trim(),
      signatureData,
    });
    setSigned(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{contract.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Please review and sign below</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contract.body_html) }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sign This Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="signer">Full Legal Name</Label>
            <Input
              id="signer"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <Label>Signature</Label>
            <SignaturePad onSave={setSignatureData} disabled={signMutation.isPending} />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
            />
            <Label htmlFor="agree" className="text-sm leading-snug">
              I agree to the terms outlined in this contract and confirm my signature above is legally binding.
            </Label>
          </div>

          <Button
            className="w-full"
            onClick={handleSign}
            disabled={!signerName.trim() || !signatureData || !agreed || signMutation.isPending}
          >
            {signMutation.isPending ? "Signing…" : "Sign Contract"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
