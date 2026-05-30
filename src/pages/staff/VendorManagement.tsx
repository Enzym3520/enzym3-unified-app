import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateInviteModal } from '@/components/staff/vendor-invites/CreateInviteModal';
import { BulkInviteUploader } from '@/components/staff/vendor-invites/BulkInviteUploader';
import { VendorManagementTable } from '@/components/staff/vendor-management/VendorManagementTable';
import { VendorStats } from '@/components/staff/vendor-management/VendorStats';
import { useVendorManagement } from '@/hooks/useVendorManagement';
import { AdminVendorRates } from '@/components/staff/vendor-management/AdminVendorRates';
import { useUserRole } from '@/hooks/useUserRole';


export default function VendorManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isAdmin, isModerator, isLoading: roleLoading } = useUserRole();

  // Coordinators only see vendors they invited; admins see all
  const scopeToCurrentUser = !isAdmin;
  const { data: vendors, isLoading } = useVendorManagement({ scopeToCurrentUser });

  const pendingCount = useMemo(
    () => vendors?.filter((v) => v.status === 'pending').length || 0,
    [vendors]
  );

  const activeCount = useMemo(
    () => vendors?.filter((v) => v.status === 'active').length || 0,
    [vendors]
  );

  // Role guard: only admins and coordinators (moderators) can access
  if (!roleLoading && !isAdmin && !isModerator) {
    return <Navigate to="/" replace />;
  }

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">
            {isAdmin ? 'Team & Vendor Management' : 'My Vendors'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? 'Manage coordinator and vendor invitations, registrations, and active team members'
              : 'Manage vendors you have invited and their registrations'}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Invite
        </Button>
      </div>

      <VendorStats scopeToCurrentUser={scopeToCurrentUser} />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Invites
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Vendors
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Vendors</TabsTrigger>
          {isAdmin && <TabsTrigger value="rates">Rates Comparison</TabsTrigger>}
          {isAdmin && <TabsTrigger value="bulk">Bulk Import</TabsTrigger>}
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Vendors who have been invited but haven't completed registration yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorManagementTable
                vendors={vendors || []}
                isLoading={isLoading}
                statusFilter="pending"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Vendors</CardTitle>
              <CardDescription>
                Registered vendors with active accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorManagementTable
                vendors={vendors || []}
                isLoading={isLoading}
                statusFilter="active"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Directory</CardTitle>
              <CardDescription>
                View and manage all vendors including pending invites, active vendors, and registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorManagementTable
                vendors={vendors || []}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="rates" className="space-y-4">
            <AdminVendorRates />
          </TabsContent>
        )}

        {isAdmin && (
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
        )}
      </Tabs>

      <CreateInviteModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
