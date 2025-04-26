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
  Pencil
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

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

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
                        <Button size="sm">
                          <Boxes className="h-4 w-4 mr-2" />
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
                                  <Button variant="ghost" size="icon">
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
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
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
                        <Button size="sm">
                          <Package className="h-4 w-4 mr-2" />
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
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
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
                        <Button size="sm">
                          <Tag className="h-4 w-4 mr-2" />
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
                                  <Button variant="ghost" size="icon">
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
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
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