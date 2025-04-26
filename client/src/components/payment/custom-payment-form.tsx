import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, CreditCard, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiPaypal } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";

interface PaymentFormProps {
  planId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomPaymentForm({ planId, amount, onSuccess, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // First, create the subscription
      const subscriptionData = {
        userId: user?.id,
        planId: planId,
        paymentMethod: paymentMethod
      };

      // Create subscription
      const subscriptionResponse = await apiRequest("POST", "/api/create-subscription", subscriptionData);
      
      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }
      
      // Now process the payment details
      const paymentData = {
        paymentMethod: paymentMethod,
        planId: planId,
        amount: amount,
      };
      
      // Add payment method specific details
      if (paymentMethod === 'credit-card') {
        Object.assign(paymentData, {
          cardNumber: cardNumber,
          cardName: cardName,
          expiryDate: expiryDate,
          cvv: cvv
        });
      } else if (paymentMethod === 'paypal') {
        Object.assign(paymentData, {
          paypalEmail: paypalEmail
        });
      }
      
      // Process payment details
      const paymentResponse = await apiRequest("POST", "/api/process-payment", paymentData);
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || "Payment processing failed");
      }

      // Show success message
      setIsSuccess(true);
      
      // Notify parent component of success after a brief delay
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "There was a problem processing your payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // If payment was successful
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-4">
            Your {planId === "basic" ? "Basic" : "Pro"} plan subscription has been activated.
          </p>
          <Button className="w-full" onClick={onSuccess}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              {planId === "basic" ? "Basic" : "Pro"} Plan - ${amount}/month
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="credit-card" onValueChange={setPaymentMethod}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="credit-card" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Credit Card
            </TabsTrigger>
            <TabsTrigger value="paypal" className="flex items-center">
              <SiPaypal className="mr-2 h-4 w-4 text-[#003087]" />
              PayPal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credit-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input 
                  id="cardName" 
                  placeholder="John Smith" 
                  value={cardName} 
                  onChange={e => setCardName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input 
                  id="cardNumber" 
                  placeholder="1234 5678 9012 3456" 
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input 
                    id="expiryDate" 
                    placeholder="MM/YY" 
                    value={expiryDate}
                    onChange={e => setExpiryDate(formatExpiryDate(e.target.value))}
                    maxLength={5}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123" 
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, ""))}
                    maxLength={4}
                    required 
                  />
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="paypal">
            <div className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4 flex items-center">
                <SiPaypal className="h-8 w-8 text-[#003087] mr-3" />
                <div>
                  <h3 className="font-medium text-[#003087]">Pay with PayPal</h3>
                  <p className="text-sm text-[#3b5998]">Safe and secure payments with PayPal</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paypalEmail">PayPal Email</Label>
                <Input 
                  id="paypalEmail" 
                  type="email" 
                  placeholder="your-email@example.com" 
                  value={paypalEmail}
                  onChange={e => setPaypalEmail(e.target.value)}
                  required 
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                You will be redirected to PayPal to complete your payment securely.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Processing...
            </>
          ) : (
            `Pay $${amount}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}