import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Header } from "@/components/layout/header";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  User, 
  CreditCard, 
  Settings, 
  Database, 
  Boxes, 
  Package,
  Tag,
  FileText,
  Pencil,
  Plus,
  Save,
  X,
  Ruler,
  MoveHorizontal,
  Loader2
} from "lucide-react";
import SubscriptionManagement from "@/components/account/subscription-management";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [measurementFormat, setMeasurementFormat] = useState("generic");
  const [canUsePipeCuttingOptimization, setCanUsePipeCuttingOptimization] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Get the active workspace
  const { data: workspaces } = useQuery<any[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user
  });
  
  useEffect(() => {
    if (workspaces?.length > 0) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [workspaces]);
  
  // Material Groups queries and mutations
  const { data: materialGroups, refetch: refetchMaterialGroups } = useQuery<any[]>({
    queryKey: ["/api/workspaces", workspaceId, "material-groups"],
    enabled: !!workspaceId
  });
  
  const createMaterialGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST", 
        `/api/workspaces/${workspaceId}/material-groups`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Material group created successfully" });
      setGroupDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "material-groups"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create material group", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  const updateMaterialGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/material-groups/${data.id}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Material group updated successfully" });
      setGroupDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "material-groups"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update material group", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  // Material Groups and Material Warehouse queries
  const { data: groups, refetch: refetchGroups } = useQuery<any[]>({
    queryKey: ["/api/workspaces", workspaceId, "material-groups"],
    enabled: !!workspaceId
  });

  const { data: materials, refetch: refetchMaterials } = useQuery<any[]>({
    queryKey: ["/api/workspaces", workspaceId, "material-warehouse"],
    enabled: !!workspaceId
  });
  
  const createMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST", 
        `/api/workspaces/${workspaceId}/material-warehouse`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Material added successfully" });
      setMaterialDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "material-warehouse"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add material", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  const updateMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/material-warehouse/${data.id}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Material updated successfully" });
      setMaterialDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "material-warehouse"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update material", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  // Material Warehouse state and handlers
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  
  // Custom Fields queries and mutations
  const { data: customFields, refetch: refetchCustomFields } = useQuery<any[]>({
    queryKey: ["/api/workspaces", workspaceId, "custom-text-fields"],
    enabled: !!workspaceId
  });
  
  const createCustomFieldMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST", 
        `/api/workspaces/${workspaceId}/custom-text-fields`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Custom field added successfully" });
      setFieldDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "custom-text-fields"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add custom field", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  const updateCustomFieldMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/custom-text-fields/${data.id}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Custom field updated successfully" });
      setFieldDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "custom-text-fields"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update custom field", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  // Custom Fields state and handlers
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  
  // Material Groups state and handlers
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  
  // User Settings queries and mutations
  const { data: userSettings } = useQuery<any>({
    queryKey: ["/api/user/settings"],  // Updated to the correct endpoint
    enabled: !!user,
    onSuccess: (data) => {
      if (data?.measurementFormat) {
        setMeasurementFormat(data.measurementFormat);
      }
      if (data?.canUsePipeCuttingOptimization !== undefined) {
        setCanUsePipeCuttingOptimization(data.canUsePipeCuttingOptimization);
      }
    }
  });
  
  const updateUserSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH", 
        "/api/user-settings",  // This is the new endpoint we created
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });  // Updated to match the GET endpoint
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update settings", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  // Function to save user settings
  const saveUserSettings = () => {
    setSavingSettings(true);
    updateUserSettingsMutation.mutate({
      measurementFormat,
      canUsePipeCuttingOptimization
    }, {
      onSettled: () => {
        setSavingSettings(false);
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs
                  orientation="vertical"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="h-full"
                >
                  <TabsList className="flex flex-col items-start w-full p-0 bg-transparent space-y-1">
                    <TabsTrigger
                      value="profile"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    {/* Subscription tab hidden per request */}
                    {/* Material Groups, Material Warehouse, and Custom Fields tabs hidden per request */}
                    <TabsTrigger
                      value="cutting-plans"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Cutting Plans
                    </TabsTrigger>
                    {/* Settings tab hidden per request */}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="profile" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      Manage your account information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Username
                          </div>
                          <div className="font-medium">{user.username}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Email
                          </div>
                          <div className="font-medium">{user.email}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Account Type
                          </div>
                          <div className="font-medium capitalize">{user.role}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Member Since
                          </div>
                          <div className="font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscription" className="mt-0">
                <SubscriptionManagement />
              </TabsContent>

              <TabsContent value="material-groups" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Material Groups</CardTitle>
                    <CardDescription>
                      Organize your materials by groups
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Material Groups</h3>
                        <Button size="sm" onClick={() => {
                          setEditingGroup(null);
                          setGroupDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Group
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Group Name</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groups && groups.length > 0 ? (
                              groups.map((group) => (
                                <TableRow key={group.id}>
                                  <TableCell>{group.name}</TableCell>
                                  <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell>{materials?.filter(m => m.groupId === group.id)?.length || 0}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          setEditingGroup(group);
                                          setGroupDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                  No material groups found. Add your first group using the button above.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Material Group Dialog */}
                    <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
                      <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingGroup ? 'Edit Material Group' : 'Add New Material Group'}
                          </DialogTitle>
                          <DialogDescription>
                            Create material groups to better organize your inventory.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="group-name">Group Name</Label>
                            <Input 
                              id="group-name" 
                              placeholder="e.g. Standard Pipes, Special Alloys, etc." 
                              defaultValue={editingGroup?.name || ""}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea 
                              id="description" 
                              placeholder="Description of this material group"
                              defaultValue={editingGroup?.description || ""}
                            />
                          </div>
                          
                          <div className="p-3 bg-muted rounded-md">
                            <h4 className="text-sm font-medium mb-2">Material Group Usage</h4>
                            <p className="text-xs text-muted-foreground">
                              Material groups help organize your inventory and make it easier to find materials when 
                              creating cutting plans. They can also be used in the optimization algorithm for more 
                              efficient material usage.
                            </p>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setGroupDialogOpen(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              const name = (document.getElementById("group-name") as HTMLInputElement).value;
                              const description = (document.getElementById("description") as HTMLTextAreaElement).value;
                              
                              if (!name) {
                                toast({
                                  title: "Group name is required",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              if (editingGroup) {
                                // Update existing group
                                updateMaterialGroupMutation.mutate({
                                  id: editingGroup.id,
                                  name,
                                  description
                                });
                              } else {
                                // Create new group
                                createMaterialGroupMutation.mutate({
                                  name,
                                  description,
                                  workspaceId
                                });
                              }
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingGroup ? 'Save Changes' : 'Add Group'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="material-warehouse" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Material Warehouse</CardTitle>
                    <CardDescription>
                      Manage your material inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Material Inventory</h3>
                        <Button size="sm" onClick={() => {
                          setEditingMaterial(null);
                          setMaterialDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Material
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Diameter</TableHead>
                              <TableHead>Thickness</TableHead>
                              <TableHead>Length</TableHead>
                              <TableHead>Group</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {materials && materials.length > 0 ? (
                              materials.map((material) => (
                                <TableRow key={material.id}>
                                  <TableCell>{material.material}</TableCell>
                                  <TableCell>{material.diameter} mm</TableCell>
                                  <TableCell>{material.thickness} mm</TableCell>
                                  <TableCell>{material.length} mm</TableCell>
                                  <TableCell>{material.groupId ? groups?.find(g => g.id === material.groupId)?.name || 'None' : 'None'}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {material.status || 'Available'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          setEditingMaterial(material);
                                          setMaterialDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                  No materials found. Add your first material using the button above.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Material Dialog */}
                    <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingMaterial ? 'Edit Material' : 'Add New Material'}
                          </DialogTitle>
                          <DialogDescription>
                            Enter the specifications for this pipe material.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="material">Material Type</Label>
                              <Input 
                                id="material" 
                                placeholder="e.g. Carbon Steel" 
                                defaultValue={editingMaterial?.material || ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="group">Material Group</Label>
                              <Select defaultValue={editingMaterial?.groupId?.toString() || ""}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select group" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {groups && groups.map((group) => (
                                    <SelectItem key={group.id} value={group.id.toString()}>
                                      {group.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="diameter">Diameter (mm)</Label>
                              <Input 
                                id="diameter" 
                                type="number" 
                                step="0.1"
                                min="0"
                                defaultValue={editingMaterial?.diameter?.toString() || ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="thickness">Thickness (mm)</Label>
                              <Input 
                                id="thickness" 
                                type="number" 
                                step="0.1"
                                min="0"
                                defaultValue={editingMaterial?.thickness?.toString() || ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="length">Length (mm)</Label>
                              <Input 
                                id="length" 
                                type="number" 
                                step="1"
                                min="0"
                                defaultValue={editingMaterial?.length?.toString() || ""}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="status">Status</Label>
                              <Select defaultValue={editingMaterial?.status || "Available"}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Available">Available</SelectItem>
                                  <SelectItem value="In Use">In Use</SelectItem>
                                  <SelectItem value="Reserved">Reserved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea 
                              id="notes" 
                              placeholder="Optional notes about this material"
                              defaultValue={editingMaterial?.notes || ""}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setMaterialDialogOpen(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              const material = (document.getElementById("material") as HTMLInputElement).value;
                              const groupIdSelect = document.querySelector('select[id^="radix-:"]') as HTMLSelectElement;
                              const groupId = groupIdSelect && groupIdSelect.value !== "none" ? Number(groupIdSelect.value) : null;
                              const diameter = Number((document.getElementById("diameter") as HTMLInputElement).value);
                              const thickness = Number((document.getElementById("thickness") as HTMLInputElement).value);
                              const length = Number((document.getElementById("length") as HTMLInputElement).value);
                              const statusSelect = document.querySelectorAll('select[id^="radix-:"]')[1] as HTMLSelectElement;
                              const status = statusSelect ? statusSelect.value : "Available";
                              const notes = (document.getElementById("notes") as HTMLTextAreaElement).value;
                              
                              if (!material) {
                                toast({
                                  title: "Material type is required",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              if (!diameter || !thickness || !length) {
                                toast({
                                  title: "All dimensions are required",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              if (editingMaterial) {
                                // Update existing material
                                updateMaterialMutation.mutate({
                                  id: editingMaterial.id,
                                  material,
                                  groupId,
                                  diameter,
                                  thickness,
                                  length,
                                  status,
                                  notes
                                });
                              } else {
                                // Create new material
                                createMaterialMutation.mutate({
                                  material,
                                  groupId,
                                  diameter,
                                  thickness,
                                  length,
                                  status,
                                  notes,
                                  workspaceId
                                });
                              }
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingMaterial ? 'Save Changes' : 'Add Material'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom-fields" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Fields</CardTitle>
                    <CardDescription>
                      Create custom text fields for your cutting plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Custom Text Fields</h3>
                        <Button size="sm" onClick={() => {
                          setEditingField(null);
                          setFieldDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Field
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Field Name</TableHead>
                              <TableHead>Display in Plans</TableHead>
                              <TableHead>Order</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customFields && customFields.length > 0 ? (
                              customFields.map((field) => (
                                <TableRow key={field.id}>
                                  <TableCell>{field.fieldName}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={field.displayInPlans ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                      {field.displayInPlans ? "Yes" : "No"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{field.fieldOrder}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          setEditingField(field);
                                          setFieldDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                  No custom fields found. Add your first field using the button above.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Custom Field Dialog */}
                    <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
                      <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingField ? 'Edit Custom Field' : 'Add New Custom Field'}
                          </DialogTitle>
                          <DialogDescription>
                            Create custom fields to use in your cutting plans.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="field-name">Field Name</Label>
                            <Input 
                              id="field-name" 
                              placeholder="e.g. Project Number, Client Name, etc." 
                              defaultValue={editingField?.fieldName || ""}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="field-order">Display Order</Label>
                            <Input 
                              id="field-order" 
                              type="number" 
                              min="1"
                              defaultValue={editingField?.fieldOrder?.toString() || "1"}
                            />
                            <p className="text-xs text-muted-foreground">
                              Lower numbers appear first in forms and reports
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="display-in-plans" 
                              defaultChecked={editingField?.displayInPlans || true}
                            />
                            <Label htmlFor="display-in-plans">Display in cutting plans</Label>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setFieldDialogOpen(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              const fieldName = (document.getElementById("field-name") as HTMLInputElement).value;
                              const fieldOrder = Number((document.getElementById("field-order") as HTMLInputElement).value);
                              const displayInPlans = (document.getElementById("display-in-plans") as HTMLInputElement).checked;
                              
                              if (!fieldName) {
                                toast({
                                  title: "Field name is required",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              if (editingField) {
                                // Update existing field
                                updateCustomFieldMutation.mutate({
                                  id: editingField.id,
                                  fieldName,
                                  fieldOrder,
                                  displayInPlans
                                });
                              } else {
                                // Create new field
                                createCustomFieldMutation.mutate({
                                  fieldName,
                                  fieldOrder,
                                  displayInPlans,
                                  workspaceId
                                });
                              }
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingField ? 'Save Changes' : 'Add Field'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cutting-plans" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Cutting Plans</CardTitle>
                    <CardDescription>
                      Manage your cutting plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Cutting Plans</h3>
                        <Button size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Create New Plan
                        </Button>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Plan Name</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Waste %</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Project Alpha Cutting</TableCell>
                              <TableCell>{new Date().toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Completed
                                </Badge>
                              </TableCell>
                              <TableCell>3.2%</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Optimization Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="kerf-width">Kerf Width (mm)</Label>
                            <Input id="kerf-width" type="number" defaultValue="2.5" />
                          </div>
                          <div>
                            <Label htmlFor="min-waste">Min Waste Threshold (%)</Label>
                            <Input id="min-waste" type="number" defaultValue="1.0" />
                          </div>
                          <div>
                            <Label htmlFor="waste-reduction">Prioritize Waste Reduction</Label>
                            <Select defaultValue="75">
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="25">Low (25%)</SelectItem>
                                <SelectItem value="50">Medium (50%)</SelectItem>
                                <SelectItem value="75">High (75%)</SelectItem>
                                <SelectItem value="100">Maximum (100%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button variant="outline" className="w-full">
                              Save Default Settings
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                      Manage your application settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Measurement Format</h3>
                        <div className="mb-6">
                          <RadioGroup 
                            defaultValue="generic"
                            className="space-y-3"
                            onValueChange={(value) => setMeasurementFormat(value)}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="generic" id="generic" />
                              <Label htmlFor="generic">Generic/Metric (15.75)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="decimal-inches" id="decimal-inches" />
                              <Label htmlFor="decimal-inches">Decimal inches (15.75")</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="decimal-feet-inches" id="decimal-feet-inches" />
                              <Label htmlFor="decimal-feet-inches">Decimal feet & inches (1' 3.75")</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fractional-inches" id="fractional-inches" />
                              <Label htmlFor="fractional-inches">Fractional inches (15 3/4")</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fractional-feet-inches" id="fractional-feet-inches" />
                              <Label htmlFor="fractional-feet-inches">Fractional feet & inches (1' 3 3/4")</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <Separator className="my-6" />
                        
                        <h3 className="text-lg font-medium mb-3">Feature Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <Label className="text-base">
                                Pipe Cutting Optimization
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Use the intelligent algorithm to optimize pipe cutting and minimize waste
                              </p>
                            </div>
                            <Switch
                              checked={canUsePipeCuttingOptimization}
                              onCheckedChange={setCanUsePipeCuttingOptimization}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          className="mt-6" 
                          onClick={saveUserSettings}
                          disabled={savingSettings}
                        >
                          {savingSettings ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Settings
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Other setting sections will go here */}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}