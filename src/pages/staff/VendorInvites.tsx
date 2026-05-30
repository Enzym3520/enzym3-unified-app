import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InviteCodeTable } from '@/components/staff/vendor-invites/InviteCodeTable';
import { CreateInviteModal } from '@/components/staff/vendor-invites/CreateInviteModal';
import { BulkInviteUploader } from '@/components/staff/vendor-invites/BulkInviteUploader';
import { useVendorInvites } from '@/hooks/useVendorInvites';
import { useUserRole } from '@/hooks/useUserRole';

export default function VendorInvites() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: invites, isLoading } = useVendorInvites();
  const { isAdmin, isModerator, isLoading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">Vendor Invites</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage vendor invitation codes
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Invite
        </Button>
      </div>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList>
          <TabsTrigger value="single">Single Invites</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Codes</CardTitle>
              <CardDescription>
                View and manage all vendor invitation codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteCodeTable invites={invites || []} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Vendor Invites</CardTitle>
              <CardDescription>
                Upload a CSV file to invite multiple vendors at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkInviteUploader />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateInviteModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
