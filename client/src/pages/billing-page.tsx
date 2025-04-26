import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  CreditCard,
  CheckCircle,
  ArrowRight,
  Loader2,
  Package,
  Shield,
  Zap,
  Users,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Make sure to call `loadStripe` outside of a component's render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

function SubscriptionForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe has not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/billing?success=true",
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
        ) : (
          <>Subscribe Now</>
        )}
      </Button>
    </form>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  
  // Get user's subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/users", user?.id, "subscription"],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await fetch(`/api/users/${user.id}/subscription`, {
          credentials: 'include'
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !!user?.id
  });
  
  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-subscription", {
        planId: selectedPlan
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPaymentForm(true);
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubscribe = () => {
    createSubscriptionMutation.mutate();
  };
  
  // Handle successful subscription redirect
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  
  if (success) {
    queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "subscription"] });
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Billing & Subscription</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">Manage your PipeNest subscription and payment methods</p>
        </div>
        
        {isLoadingSubscription ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : subscription?.status === "active" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Current Subscription</CardTitle>
                    <CardDescription>Your subscription details and usage</CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" /> Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Plan</h3>
                    <p className="text-lg font-medium">{subscription.planId === "price_1Oy0b02dQHO8UpMb4YwGfHIS" ? "Pro Plan" : "Basic Plan"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Billing Period</h3>
                    <p className="text-lg font-medium">Monthly</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Next Payment</h3>
                    <p className="text-lg font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Usage Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Projects</h4>
                            <p className="text-2xl font-semibold">5 / 10</p>
                          </div>
                          <Package className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Team Members</h4>
                            <p className="text-2xl font-semibold">3 / 5</p>
                          </div>
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Optimizations</h4>
                            <p className="text-2xl font-semibold">32 / 100</p>
                          </div>
                          <Zap className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Update Payment Method</Button>
                <Button variant="destructive">Cancel Subscription</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Your recent invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <p className="font-medium">Invoice #1001</p>
                      <p className="text-sm text-neutral-500">{new Date(subscription.currentPeriodStart).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="font-medium mr-4">$29.99</p>
                      <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {showPaymentForm && clientSecret ? (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Subscription</CardTitle>
                  <CardDescription>Enter your payment details to subscribe to the {selectedPlan === "pro" ? "Pro" : "Basic"} plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SubscriptionForm />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                    Select the perfect plan for your pipe cutting optimization needs
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Basic Plan */}
                  <Card className={`border-2 ${selectedPlan === "basic" ? "border-primary" : "border-border"}`}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Basic Plan</CardTitle>
                          <CardDescription>For small teams and individuals</CardDescription>
                        </div>
                        {selectedPlan === "basic" && (
                          <Badge className="bg-primary">Selected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-4xl font-bold">$14.99</span>
                        <span className="text-neutral-500 dark:text-neutral-400 ml-2">/ month</span>
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>Up to 5 projects</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>3 team members</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>50 optimizations per month</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>Email support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={selectedPlan === "basic" ? "default" : "outline"}
                        onClick={() => setSelectedPlan("basic")}
                      >
                        {selectedPlan === "basic" ? "Selected" : "Select Plan"}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Pro Plan */}
                  <Card className={`border-2 ${selectedPlan === "pro" ? "border-primary" : "border-border"}`}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Pro Plan</CardTitle>
                          <CardDescription>For businesses and larger teams</CardDescription>
                        </div>
                        {selectedPlan === "pro" && (
                          <Badge className="bg-primary">Selected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-4xl font-bold">$29.99</span>
                        <span className="text-neutral-500 dark:text-neutral-400 ml-2">/ month</span>
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <ul className="space-y-3">
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>Unlimited projects</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>10 team members</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>Unlimited optimizations</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>Advanced analytics</span>
                        </li>
                        <li className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>API access</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={selectedPlan === "pro" ? "default" : "outline"}
                        onClick={() => setSelectedPlan("pro")}
                      >
                        {selectedPlan === "pro" ? "Selected" : "Select Plan"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button 
                    size="lg" 
                    onClick={handleSubscribe} 
                    disabled={createSubscriptionMutation.isPending}
                    className="px-8"
                  >
                    {createSubscriptionMutation.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      <>Continue to Payment <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
