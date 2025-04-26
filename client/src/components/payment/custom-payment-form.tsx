import { useState } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const PaypalIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M7.144 19.532l1.049-5.751A4.228 4.228 0 0112.292 10h3.725a5.738 5.738 0 004.802-2.27l-1.51 8.26a4.228 4.228 0 01-3.6 3.472L7.144 19.532z" />
    <path d="M3.42 19.532l1.048-5.751A4.228 4.228 0 018.56 10h3.7a5.738 5.738 0 004.806-2.27L15.536 16c-.186 1.02-.98 1.85-2.006 2.105l-8.11.21c-.56.015-1.012.466-1.033 1.028-.022.562.406 1.036.967 1.07l.067.003z" />
  </svg>
);

interface PaymentFormProps {
  planId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomPaymentForm({ planId, amount, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardHolderName, setCardHolderName] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Perform basic validation
      if (paymentMethod === "credit-card") {
        if (!cardNumber || !cardHolderName || !expiryDate || !cvv) {
          throw new Error("Please fill in all required fields");
        }
        
        if (cardNumber.length < 15) {
          throw new Error("Please enter a valid card number");
        }
        
        if (cvv.length < 3) {
          throw new Error("Please enter a valid CVV");
        }
      }

      // Process the payment through our backend
      const response = await apiRequest("POST", "/api/process-payment", {
        paymentMethod,
        planId,
        amount,
        cardDetails: paymentMethod === "credit-card" ? {
          cardNumber,
          cardHolderName,
          expiryDate,
          cvv
        } : undefined
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment processing failed");
      }

      // Payment successful
      toast({
        title: "Payment Successful",
        description: "Your subscription has been processed successfully",
        variant: "default",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Enter your payment details to subscribe to the selected plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Credit/Debit Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paypal">
                    <div className="flex items-center">
                      <PaypalIcon className="h-4 w-4 mr-2" />
                      <span>PayPal</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "credit-card" && (
              <>
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={16}
                  />
                </div>
                <div>
                  <Label htmlFor="cardHolderName">Card Holder Name</Label>
                  <Input
                    id="cardHolderName"
                    placeholder="John Doe"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          const month = value.slice(0, 2);
                          const year = value.slice(2);
                          setExpiryDate(
                            value.length > 2 ? `${month}/${year}` : month
                          );
                        }
                      }}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                    />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === "paypal" && (
              <div className="flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-800 rounded-md">
                <div className="text-center">
                  <PaypalIcon className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    You will be redirected to PayPal to complete your payment after clicking the button below.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <p className="font-medium">
              Total: ${(amount).toFixed(2)}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}