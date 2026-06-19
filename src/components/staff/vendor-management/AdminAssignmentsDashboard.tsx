import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllAssignments, useAssignmentStats } from '@/hooks/useAdminAssignments';
import { CheckCircle, Clock, Users, XCircle, Search, Eye, DollarSign } from 'lucide-react';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import { formatEventType } from '@/utils/notificationHelpers';
import { capitalizeNames } from '@/utils/contactHelpers';
import { format } from 'date-fns';
import { useAllAssignmentCosts } from '@/hooks/useAssignmentCosts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AdminAssignmentsDashboard = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stats } = useAssignmentStats();
  const { data: assignments, isLoading } = useAllAssignments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  });
  const { data: costsData } = useAllAssignmentCosts();

  const getStatusBadge = (status: string) => {
    const config = {
      assigned: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      declined: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      completed: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CheckCircle },
    };

    const { color, icon: Icon } = config[status as keyof typeof config] || config.assigned;

    return (
      <Badge variant="outline" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            </CardContent>
          </Card>

          {costsData && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${costsData.totalProfit.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${costsData.totalClientPrices.toFixed(0)} revenue - ${costsData.totalVendorCosts.toFixed(0)} costs
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by couple name or vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignments Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading assignments...</div>
          ) : assignments && assignments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor Cost</TableHead>
                    <TableHead>Client Price</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment: any) => {
                    const cost = costsData?.assignments.find((c: any) => c.assignment_id === assignment.id);
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{capitalizeNames(assignment.event?.couple_name || '')}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatEventType(assignment.event?.event_type || '')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {assignment.vendor?.company_name ||
                                `${assignment.vendor?.first_name || ''} ${assignment.vendor?.last_name || ''}`.trim()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatVendorType(assignment.vendor?.vendor_type)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.event?.event_date &&
                            format(new Date(assignment.event.event_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>
                          {cost ? (
                            <span className="text-sm">${cost.total_vendor_cost.toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cost ? (
                            <span className="text-sm font-medium text-green-600">
                              ${cost.total_client_price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cost ? (
                            <span className="text-sm font-semibold text-green-600">
                              ${(cost.total_client_price - cost.total_vendor_cost).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(assignment.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== 'all' ? 'No assignments found matching your filters.' : 'No assignments yet.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAssignmentsDashboard;
