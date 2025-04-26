import { useState } from "react";
import { Header } from "@/components/layout/header";
import InputPanel from "@/components/optimization/input-panel";
import OptimizationResults from "@/components/optimization/optimization-results";
import { OptimizationParameters, PipeSpecification, RequiredCut, OptimizationResult } from "@/lib/optimization";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [pipeSpec, setPipeSpec] = useState<PipeSpecification>({
    length: 6000,
    diameter: 48.3,
    thickness: 3.2,
    material: "Carbon Steel",
    quantity: 10
  });
  
  const [requiredCuts, setRequiredCuts] = useState<RequiredCut[]>([
    { length: 1200, quantity: 12 },
    { length: 850, quantity: 8 },
    { length: 2400, quantity: 4 }
  ]);
  
  const [optimizationParams, setOptimizationParams] = useState<OptimizationParameters>({
    kerfWidth: 2.0,
    minWasteThreshold: 100,
    prioritizeWasteReduction: 70
  });
  
  // Get user's active project or workspace if available
  const { data: userWorkspaces, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["/api/workspaces"],
    enabled: true,
  });
  
  // Optimization mutation
  const optimizeMutation = useMutation<OptimizationResult, Error>({
    mutationFn: async () => {
      // Always use the backend API for optimization
      // For simplicity in this MVP, we'll just use a fixed project ID
      let projectId = 1; // Default for demo
      
      const res = await apiRequest("POST", `/api/projects/${projectId}/optimize`, {
        pipeSpec,
        requiredCuts,
        parameters: optimizationParams
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Optimization failed");
      }
      
      const data = await res.json();
      console.log("Received optimization results:", data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["optimization-results"], data);
      toast({
        title: "Optimization Complete",
        description: `Successfully optimized with ${data.materialEfficiency.toFixed(1)}% material efficiency`,
      });
    },
    onError: (error) => {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onOptimize = () => {
    optimizeMutation.mutate();
  };
  
  const handlePipeSpecChange = (newPipeSpec: PipeSpecification) => {
    setPipeSpec(newPipeSpec);
  };
  
  const handleRequiredCutsChange = (newRequiredCuts: RequiredCut[]) => {
    setRequiredCuts(newRequiredCuts);
  };
  
  const handleOptimizationParamsChange = (newParams: OptimizationParameters) => {
    setOptimizationParams(newParams);
  };
  
  // Get optimization results if available
  const { data: optimizationResults } = useQuery<OptimizationResult>({
    queryKey: ["optimization-results"],
    enabled: false, // Only fetch when explicitly requested
  });
  
  if (isLoadingWorkspaces) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Pipe Cutting Optimization</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">Minimize waste and maximize efficiency with our cutting-edge nesting algorithm</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InputPanel 
            pipeSpec={pipeSpec}
            requiredCuts={requiredCuts}
            optimizationParams={optimizationParams}
            onPipeSpecChange={handlePipeSpecChange}
            onRequiredCutsChange={handleRequiredCutsChange}
            onOptimizationParamsChange={handleOptimizationParamsChange}
            onOptimize={onOptimize}
            isOptimizing={optimizeMutation.isPending}
          />
          
          <OptimizationResults 
            results={optimizationResults}
            loading={optimizeMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
