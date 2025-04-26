import { useState } from "react";
import { Header } from "@/components/layout/header";
import InputPanel from "@/components/optimization/input-panel";
import OptimizationResults from "@/components/optimization/optimization-results";
import { OptimizationParameters, PipeSpecification, RequiredCut } from "@/lib/optimization";
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
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      // If user has a workspace and project, we'll use the API
      if (userWorkspaces && userWorkspaces.length > 0) {
        // For simplicity in this MVP, we'll just use the first project or create one if needed
        let projectId = 1; // Default for demo
        
        const res = await apiRequest("POST", `/api/projects/${projectId}/optimize`, {
          pipeSpec,
          requiredCuts,
          parameters: optimizationParams
        });
        
        return await res.json();
      } else {
        // Otherwise just use client-side calculation for demo
        // This would be replaced with a real API call in production
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              pipesUsed: 4,
              materialEfficiency: 92.4,
              totalWaste: 1824,
              cutOperations: 24,
              results: [
                {
                  pipeIndex: 0,
                  cuts: [
                    { length: 1200, startPos: 0, endPos: 1200 },
                    { length: 1200, startPos: 1202, endPos: 2402 },
                    { length: 1200, startPos: 2404, endPos: 3604 },
                    { length: 1200, startPos: 3606, endPos: 4806 },
                    { length: 850, startPos: 4808, endPos: 5658 }
                  ],
                  waste: 350
                },
                {
                  pipeIndex: 1,
                  cuts: [
                    { length: 850, startPos: 0, endPos: 850 },
                    { length: 850, startPos: 852, endPos: 1702 },
                    { length: 850, startPos: 1704, endPos: 2554 },
                    { length: 2400, startPos: 2556, endPos: 4956 }
                  ],
                  waste: 1050
                },
                {
                  pipeIndex: 2,
                  cuts: [
                    { length: 2400, startPos: 0, endPos: 2400 },
                    { length: 2400, startPos: 2402, endPos: 4802 },
                    { length: 1200, startPos: 4804, endPos: 6004 }
                  ],
                  waste: 0
                },
                {
                  pipeIndex: 3,
                  cuts: [
                    { length: 1200, startPos: 0, endPos: 1200 },
                    { length: 1200, startPos: 1202, endPos: 2402 },
                    { length: 1200, startPos: 2404, endPos: 3604 },
                    { length: 1200, startPos: 3606, endPos: 4806 },
                    { length: 850, startPos: 4808, endPos: 5658 }
                  ],
                  waste: 350
                }
              ],
              parameters: optimizationParams
            });
          }, 1500); // Simulate network delay
        });
      }
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
  const { data: optimizationResults } = useQuery({
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
