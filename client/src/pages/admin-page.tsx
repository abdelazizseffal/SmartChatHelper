import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, Briefcase, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  
  // Check if user is admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }
  
  // Get admin data
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: activeTab === "users"
  });
  
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["/api/admin/workspaces"],
    enabled: activeTab === "workspaces"
  });
  
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["/api/admin/subscriptions"],
    enabled: activeTab === "subscriptions"
  });
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">Manage your PipeNest platform</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : users?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Workspaces
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingWorkspaces ? <Loader2 className="h-4 w-4 animate-spin" /> : workspaces?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active workspaces
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscriptions
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingSubscriptions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  subscriptions?.filter((sub: any) => sub.status === "active")?.length || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Paying customers
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="workspaces">
            <Card>
              <CardHeader>
                <CardTitle>Workspace Management</CardTitle>
                <CardDescription>View and manage all workspaces</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWorkspaces ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Owner ID</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workspaces && workspaces.map((workspace: any) => (
                        <TableRow key={workspace.id}>
                          <TableCell>{workspace.id}</TableCell>
                          <TableCell>{workspace.name}</TableCell>
                          <TableCell>{workspace.ownerId}</TableCell>
                          <TableCell>{new Date(workspace.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>View and manage customer subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSubscriptions ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Current Period</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions && subscriptions.map((subscription: any) => (
                        <TableRow key={subscription.id}>
                          <TableCell>{subscription.id}</TableCell>
                          <TableCell>{subscription.userId}</TableCell>
                          <TableCell>{subscription.planId}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                subscription.status === 'active' ? 'default' : 
                                subscription.status === 'canceled' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {subscription.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
