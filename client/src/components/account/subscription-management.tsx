import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { SubscriptionPlan } from "@shared/schema";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Load Stripe outside of component to avoid recreating on each render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('VITE_STRIPE_PUBLIC_KEY environment variable is not set');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : 
  null;

interface PlanCardProps {
  plan: SubscriptionPlan;
  currentPlanId?: string;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

function PlanCard({ plan, currentPlanId, onSelectPlan }: PlanCardProps) {
  const isCurrentPlan = currentPlanId === plan.planId;

  return (
    <Card className={isCurrentPlan ? "border-2 border-primary" : ""}>
      <CardHeader className="relative">
        {isCurrentPlan && (
          <Badge className="absolute top-2 right-2" variant="outline">
            Current Plan
          </Badge>
        )}
        <CardTitle className="flex items-center">
          {plan.name}
          {plan.price === 0 && (
            <Badge className="ml-2" variant="secondary">
              Free
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {plan.price > 0
            ? `$${plan.price}/${plan.interval}`
            : "No payment required"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-semibold">Projects:</span> {plan.projectLimit}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Optimizations:</span>{" "}
            {plan.optimizationLimit}
          </div>
          <div className="text-sm">
            <span className="font-semibold">PDF Export:</span>{" "}
            {plan.pdfExportEnabled ? (
              <span className="text-green-600">Included</span>
            ) : (
              <span className="text-muted-foreground">Not included</span>
            )}
          </div>
          {plan.description && (
            <div className="text-sm text-muted-foreground mt-4">
              {plan.description}
            </div>
          )}
          {plan.features && plan.features.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Features:</p>
              <ul className="text-sm space-y-1 list-disc pl-4">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={isCurrentPlan}
          onClick={() => onSelectPlan(plan)}
          variant={isCurrentPlan ? "outline" : "default"}
        >
          {isCurrentPlan ? "Current Plan" : plan.price === 0 ? "Select" : "Subscribe"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function CheckoutForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Stripe not loaded",
        description: "Please try again later",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account?payment_success=true`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Payment successful",
        description: "Thank you for your subscription!",
        variant: "default",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className={isLoading ? "opacity-70" : ""}
        >
          {isLoading ? "Processing..." : "Pay Now"}
        </Button>
      </div>
    </form>
  );
}

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    amount: number;
  } | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

  const {
    data: plans,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      const data = await res.json();
      return data as SubscriptionPlan[];
    },
  });

  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
  } = useQuery({
    queryKey: [`/api/users/${user?.id}/subscription`],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest(
        "GET",
        `/api/users/${user.id}/subscription`
      );
      const data = await res.json();
      return data;
    },
    enabled: !!user,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/create-subscription", {
        planId,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setPaymentIntent({
          clientSecret: data.clientSecret,
          amount: data.amount,
        });
        setShowPaymentForm(true);
      } else {
        // Free plan or subscription created without payment
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${user?.id}/subscription`],
        });
        toast({
          title: "Plan activated",
          description: "Your subscription has been updated successfully",
        });
        setSelectedPlan(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = () => {
    if (selectedPlan) {
      createSubscriptionMutation.mutate(selectedPlan.planId);
    }
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [`/api/users/${user?.id}/subscription`],
    });
    setShowPaymentForm(false);
    setSelectedPlan(null);
    setPaymentIntent(null);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setPaymentIntent(null);
  };

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (plansError || subscriptionError) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="font-medium text-red-900">Error Loading Data</h3>
        </div>
        <p className="text-red-700 text-sm">
          There was a problem loading subscription data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              Your subscription details and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </p>
                <div className="flex items-center">
                  {subscription.status === "active" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="font-medium">{subscription.status}</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Plan
                </p>
                <p className="font-medium">
                  {plans?.find((p) => p.planId === subscription.planId)?.name ||
                    subscription.planId}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Projects Used
                </p>
                <p className="font-medium">
                  {subscription.projectsCreated} /{" "}
                  {plans?.find((p) => p.planId === subscription.planId)
                    ?.projectLimit || "∞"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Optimizations Used
                </p>
                <p className="font-medium">
                  {subscription.optimizationsRun} /{" "}
                  {plans?.find((p) => p.planId === subscription.planId)
                    ?.optimizationLimit || "∞"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Current Period
                </p>
                <p className="font-medium">
                  {new Date(
                    subscription.currentPeriodStart
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    subscription.currentPeriodEnd
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Payment Method
                </p>
                <p className="font-medium capitalize">
                  {subscription.paymentMethod || "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-xl font-bold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={subscription?.planId}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription Change</DialogTitle>
            <DialogDescription>
              {selectedPlan?.price === 0
                ? "You're switching to a free plan."
                : `You're about to subscribe to the ${selectedPlan?.name} plan for $${selectedPlan?.price}/${selectedPlan?.interval}.`}
            </DialogDescription>
          </DialogHeader>

          {!showPaymentForm ? (
            <div className="space-y-4">
              {selectedPlan && (
                <div className="border rounded-md p-4 bg-muted/50">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <span>
                      ${selectedPlan.price}/{selectedPlan.interval}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Projects: {selectedPlan.projectLimit}</div>
                    <div>Optimizations: {selectedPlan.optimizationLimit}</div>
                    <div>
                      PDF Export:{" "}
                      {selectedPlan.pdfExportEnabled ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-between sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={!selectedPlan || createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending
                    ? "Processing..."
                    : selectedPlan?.price === 0
                    ? "Confirm"
                    : "Proceed to Payment"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            paymentIntent?.clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret: paymentIntent.clientSecret }}
              >
                <CheckoutForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}