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
} from "lucide-react";
import SubscriptionManagement from "@/components/account/subscription-management";

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
                    <div className="text-center py-10">
                      <p className="text-muted-foreground mb-4">
                        Material Group management coming soon
                      </p>
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
                    <div className="text-center py-10">
                      <p className="text-muted-foreground mb-4">
                        Material Warehouse management coming soon
                      </p>
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
                    <div className="text-center py-10">
                      <p className="text-muted-foreground mb-4">
                        Custom Text Fields management coming soon
                      </p>
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
                    <div className="text-center py-10">
                      <p className="text-muted-foreground mb-4">
                        Cutting Plans management coming soon
                      </p>
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