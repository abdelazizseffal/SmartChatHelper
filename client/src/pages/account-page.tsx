import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Header } from "@/components/layout/header";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  X
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
  const [activeTab, setActiveTab] = useState("profile");
  
  // Material Warehouse state and handlers
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  
  // Custom Fields state and handlers
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  
  // Material Groups state and handlers
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

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
                    <TabsTrigger
                      value="subscription"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscription
                    </TabsTrigger>
                    <TabsTrigger
                      value="material-groups"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <Boxes className="h-4 w-4 mr-2" />
                      Material Groups
                    </TabsTrigger>
                    <TabsTrigger
                      value="material-warehouse"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Material Warehouse
                    </TabsTrigger>
                    <TabsTrigger
                      value="custom-fields"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Custom Fields
                    </TabsTrigger>
                    <TabsTrigger
                      value="cutting-plans"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Cutting Plans
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted/50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
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
                            <TableRow>
                              <TableCell>Standard Pipes</TableCell>
                              <TableCell>{new Date().toLocaleDateString()}</TableCell>
                              <TableCell>3</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditingGroup({
                                        id: 1,
                                        name: "Standard Pipes",
                                        description: "Common standard pipes and materials"
                                      });
                                      setGroupDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Special Alloys</TableCell>
                              <TableCell>{new Date().toLocaleDateString()}</TableCell>
                              <TableCell>1</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditingGroup({
                                        id: 2,
                                        name: "Special Alloys",
                                        description: "Special stainless and high-grade alloy materials"
                                      });
                                      setGroupDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
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
                              setGroupDialogOpen(false);
                              const { toast } = useToast();
                              toast({
                                title: editingGroup ? "Group updated" : "Group added",
                                description: "Your changes have been saved successfully.",
                              });
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
                            <TableRow>
                              <TableCell>Carbon Steel</TableCell>
                              <TableCell>48.3 mm</TableCell>
                              <TableCell>3.2 mm</TableCell>
                              <TableCell>6000 mm</TableCell>
                              <TableCell>Standard Pipes</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Available
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditingMaterial({
                                        id: 1,
                                        material: "Carbon Steel",
                                        diameter: 48.3,
                                        thickness: 3.2,
                                        length: 6000,
                                        groupId: 1,
                                        status: "Available",
                                        notes: "Standard EN 10255 pipe"
                                      });
                                      setMaterialDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
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
                                  <SelectItem value="1">Standard Pipes</SelectItem>
                                  <SelectItem value="2">Special Alloys</SelectItem>
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
                              setMaterialDialogOpen(false);
                              const { toast } = useToast();
                              toast({
                                title: editingMaterial ? "Material updated" : "Material added",
                                description: "Your changes have been saved successfully.",
                              });
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
                            <TableRow>
                              <TableCell>Project Number</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Yes
                                </Badge>
                              </TableCell>
                              <TableCell>1</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditingField({
                                        id: 1,
                                        fieldName: "Project Number",
                                        displayInPlans: true,
                                        fieldOrder: 1
                                      });
                                      setFieldDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Client Name</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Yes
                                </Badge>
                              </TableCell>
                              <TableCell>2</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setEditingField({
                                        id: 2,
                                        fieldName: "Client Name",
                                        displayInPlans: true,
                                        fieldOrder: 2
                                      });
                                      setFieldDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
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
                              setFieldDialogOpen(false);
                              const { toast } = useToast();
                              toast({
                                title: editingField ? "Field updated" : "Field added",
                                description: "Your changes have been saved successfully.",
                              });
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
                    <div className="text-center py-10">
                      <p className="text-muted-foreground mb-4">
                        Settings management coming soon
                      </p>
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