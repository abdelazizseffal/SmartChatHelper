import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SubscriptionPlan } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Edit, PlusCircle } from "lucide-react";

const planFormSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  interval: z.enum(["monthly", "yearly"]),
  description: z.string().optional(),
  features: z.string().optional().transform(val => 
    val ? val.split("\n").filter(Boolean) : []
  ),
  projectLimit: z.coerce.number(),
  optimizationLimit: z.coerce.number(),
  pdfExportEnabled: z.boolean().default(false),
  active: z.boolean().default(true),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function SubscriptionPlanManagement() {
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return res.json();
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const res = await apiRequest("POST", "/api/subscription-plans", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan created",
        description: "The subscription plan has been created successfully.",
      });
      setIsCreatingPlan(false);
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating plan",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PlanFormValues }) => {
      const res = await apiRequest("PATCH", `/api/subscription-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan updated",
        description: "The subscription plan has been updated successfully.",
      });
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subscription-plans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "The subscription plan has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting plan",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const togglePlanStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/subscription-plans/${id}`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating plan status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      planId: "",
      name: "",
      price: 0,
      interval: "monthly",
      description: "",
      features: "",
      projectLimit: 1,
      optimizationLimit: 1,
      pdfExportEnabled: false,
      active: true,
    },
  });

  const editForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      planId: "",
      name: "",
      price: 0,
      interval: "monthly",
      description: "",
      features: "",
      projectLimit: 1,
      optimizationLimit: 1,
      pdfExportEnabled: false,
      active: true,
    },
  });

  function resetCreateForm() {
    createForm.reset({
      planId: "",
      name: "",
      price: 0,
      interval: "monthly",
      description: "",
      features: "",
      projectLimit: 1,
      optimizationLimit: 1,
      pdfExportEnabled: false,
      active: true,
    });
  }

  function onCreateSubmit(data: PlanFormValues) {
    createPlanMutation.mutate(data);
  }

  function onEditSubmit(data: PlanFormValues) {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    }
  }

  function handleEditPlan(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    editForm.reset({
      planId: plan.planId,
      name: plan.name,
      price: plan.price as number,
      interval: plan.interval as "monthly" | "yearly",
      description: plan.description ?? "",
      features: plan.features ? plan.features.join("\n") : "",
      projectLimit: plan.projectLimit,
      optimizationLimit: plan.optimizationLimit,
      pdfExportEnabled: plan.pdfExportEnabled,
      active: plan.active,
    });
  }

  function handleDeletePlan(id: number) {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      deletePlanMutation.mutate(id);
    }
  }

  function handleTogglePlanStatus(id: number, active: boolean) {
    togglePlanStatusMutation.mutate({ id, active: !active });
  }

  const PlanForm = ({ form, onSubmit, buttonText, closeDialog }: { 
    form: any; 
    onSubmit: (data: PlanFormValues) => void;
    buttonText: string;
    closeDialog: () => void;
  }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="planId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., premium" {...field} />
                </FormControl>
                <FormDescription>Unique identifier for the plan</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Premium Plan" {...field} />
                </FormControl>
                <FormDescription>Display name for the plan</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="29.99" {...field} />
                </FormControl>
                <FormDescription>Monthly/yearly price (0 for free plans)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Interval</FormLabel>
                <FormControl>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </FormControl>
                <FormDescription>Billing frequency</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the plan benefits..." {...field} />
              </FormControl>
              <FormDescription>Short description of the plan</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="One feature per line, e.g.:\nUnlimited projects\nPDF export" 
                  {...field} 
                  rows={4}
                />
              </FormControl>
              <FormDescription>Enter one feature per line</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="projectLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Limit</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1" 
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>Maximum number of projects (-1 for unlimited)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="optimizationLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Optimization Limit</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1" 
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>Maximum number of optimizations (-1 for unlimited)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pdfExportEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-3">
                <div>
                  <FormLabel>PDF Export</FormLabel>
                  <FormDescription>Allow users to export results as PDF</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-3">
                <div>
                  <FormLabel>Active</FormLabel>
                  <FormDescription>Plan is available for purchase</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {buttonText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading subscription plans...</div>;
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Manage subscription plans and their features
            </CardDescription>
          </div>
          <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Subscription Plan</DialogTitle>
              </DialogHeader>
              <PlanForm 
                form={createForm} 
                onSubmit={onCreateSubmit} 
                buttonText="Create Plan" 
                closeDialog={() => {
                  setIsCreatingPlan(false);
                  resetCreateForm();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Project Limit</TableHead>
              <TableHead>Optimization Limit</TableHead>
              <TableHead>PDF Export</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <div>{plan.name}</div>
                  <div className="text-muted-foreground text-xs">{plan.planId}</div>
                </TableCell>
                <TableCell>
                  {plan.price === 0 ? (
                    <span className="font-semibold text-green-600">Free</span>
                  ) : (
                    <div>
                      ${plan.price}/{plan.interval}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {plan.projectLimit === -1 ? "Unlimited" : plan.projectLimit}
                </TableCell>
                <TableCell>
                  {plan.optimizationLimit === -1 ? "Unlimited" : plan.optimizationLimit}
                </TableCell>
                <TableCell>
                  {plan.pdfExportEnabled ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={plan.active} 
                    onCheckedChange={() => handleTogglePlanStatus(plan.id, plan.active)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => {
                      if (!open) setEditingPlan(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                          <DialogTitle>Edit Subscription Plan</DialogTitle>
                        </DialogHeader>
                        <PlanForm 
                          form={editForm} 
                          onSubmit={onEditSubmit} 
                          buttonText="Update Plan" 
                          closeDialog={() => setEditingPlan(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No subscription plans found. Add your first plan to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}