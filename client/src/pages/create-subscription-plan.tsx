import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Header } from "@/components/layout/header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function CreateSubscriptionPlanPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center p-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!user || user.role !== 'super_admin') {
    return <Redirect to="/" />;
  }

  const createFreePlan = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/subscription-plans", {
        planId: "free",
        name: "Free Plan",
        price: 0,
        interval: "monthly",
        description: "Free tier with limited projects and optimizations",
        features: ["1 project", "1 optimization", "Basic support"],
        projectLimit: 1,
        optimizationLimit: 1,
        pdfExportEnabled: false,
        active: true
      });
      
      if (response.ok) {
        toast({
          title: "Free Plan Created",
          description: "The free subscription plan has been created successfully"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create plan");
      }
    } catch (error) {
      toast({
        title: "Error Creating Plan",
        description: error instanceof Error ? error.message : "Failed to create the subscription plan",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const createPremiumPlan = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/subscription-plans", {
        planId: "premium",
        name: "Premium Plan",
        price: 29.99,
        interval: "monthly",
        description: "Professional plan with unlimited projects and optimizations",
        features: ["Unlimited projects", "Unlimited optimizations", "PDF Export", "Priority support"],
        projectLimit: 999,
        optimizationLimit: 999,
        pdfExportEnabled: true,
        active: true
      });
      
      if (response.ok) {
        toast({
          title: "Premium Plan Created",
          description: "The premium subscription plan has been created successfully"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create plan");
      }
    } catch (error) {
      toast({
        title: "Error Creating Plan",
        description: error instanceof Error ? error.message : "Failed to create the subscription plan",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Subscription Plans</CardTitle>
              <CardDescription>
                Create default subscription plans for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Use the buttons below to create the default subscription plans for the application.
                This tool is only available for super admin users.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                onClick={createFreePlan} 
                disabled={isCreating}
                variant="outline"
              >
                {isCreating ? "Creating..." : "Create Free Plan"}
              </Button>
              <Button 
                onClick={createPremiumPlan}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Premium Plan"} 
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}