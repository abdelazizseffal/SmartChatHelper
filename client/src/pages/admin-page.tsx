import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, User, Briefcase, CreditCard, Settings, Shield, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  
  // Check if user is admin or super_admin
  if (user && user.role !== "admin" && user.role !== "super_admin") {
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
  
  const { data: systemStats, isLoading: isLoadingSystemStats } = useQuery({
    queryKey: ["/api/admin/system-stats"],
    enabled: activeTab === "system" && user?.role === "super_admin"
  });
  
  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
      if (!res.ok) {
        throw new Error("Failed to update user role");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsRoleDialogOpen(false);
    }
  });
  
  const openRoleDialog = (userId: number, currentRole: string) => {
    setSelectedUserId(userId);
    setSelectedRole(currentRole);
    setIsRoleDialogOpen(true);
  };
  
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
          <TabsList className={`grid w-full mb-8 ${user?.role === 'super_admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            {user?.role === 'super_admin' && (
              <TabsTrigger value="system">
                <div className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Super Admin</span>
                </div>
              </TabsTrigger>
            )}
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
                      {users && users.map((listUser: any) => (
                        <TableRow key={listUser.id}>
                          <TableCell>{listUser.id}</TableCell>
                          <TableCell>{listUser.username}</TableCell>
                          <TableCell>{listUser.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                listUser.role === 'super_admin' ? 'destructive' : 
                                listUser.role === 'admin' ? 'secondary' : 
                                'default'
                              }
                            >
                              {listUser.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(listUser.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">Details</Button>
                              {user?.role === 'super_admin' && (
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => openRoleDialog(listUser.id, listUser.role)}
                                >
                                  Edit Role
                                </Button>
                              )}
                            </div>
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
          
          {user?.role === 'super_admin' && (
            <TabsContent value="system">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-destructive" />
                      Super Admin Controls
                    </CardTitle>
                    <CardDescription>Manage system-wide settings and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 items-center gap-4">
                        <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                        <Switch id="maintenance-mode" />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-4">
                        <Label htmlFor="user-registration">User Registration</Label>
                        <Switch id="user-registration" defaultChecked />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-4">
                        <Label htmlFor="system-debug">Debug Logging</Label>
                        <Switch id="system-debug" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Save System Settings</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-primary" />
                      Payment Settings
                    </CardTitle>
                    <CardDescription>Configure payment methods and processing options</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 items-center gap-4">
                        <Label htmlFor="enable-credit-card">Credit Card Payments</Label>
                        <Switch id="enable-credit-card" defaultChecked />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-4">
                        <Label htmlFor="enable-paypal">PayPal Payments</Label>
                        <Switch id="enable-paypal" defaultChecked />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-4">
                        <Label htmlFor="enable-stripe">Stripe Integration</Label>
                        <Switch id="enable-stripe" />
                      </div>
                      <div className="pt-4 border-t mt-4">
                        <Label htmlFor="default-payment-method" className="block mb-2">Default Payment Method</Label>
                        <Select defaultValue="credit-card">
                          <SelectTrigger>
                            <SelectValue placeholder="Select default payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit-card">Credit Card</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Save Payment Settings</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2 text-primary" />
                      Database Management
                    </CardTitle>
                    <CardDescription>View and manage database information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSystemStats ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                            <p className="text-2xl font-bold">{systemStats?.projectCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Optimizations</p>
                            <p className="text-2xl font-bold">{systemStats?.optimizationCount || 0}</p>
                          </div>
                        </div>
                        <div className="rounded-md bg-muted p-4">
                          <h4 className="mb-2 text-sm font-medium">Database Health</h4>
                          <div className="text-xs text-muted-foreground">
                            <p>Connection: <span className="text-green-500 font-semibold">Connected</span></p>
                            <p>Type: PostgreSQL</p>
                            <p>Status: Active</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Backup Database</Button>
                    <Button variant="secondary">Optimize Tables</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role and permissions for this user
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedUserId) {
                  updateUserRoleMutation.mutate({
                    userId: selectedUserId,
                    role: selectedRole
                  });
                }
              }}
              disabled={updateUserRoleMutation.isPending}
            >
              {updateUserRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}