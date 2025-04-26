import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PipeSpecification, RequiredCut, OptimizationParameters } from "@/lib/optimization";
import { Trash2, RefreshCw, Sparkles, Plus } from "lucide-react";

interface InputPanelProps {
  pipeSpec: PipeSpecification;
  requiredCuts: RequiredCut[];
  optimizationParams: OptimizationParameters;
  onPipeSpecChange: (pipeSpec: PipeSpecification) => void;
  onRequiredCutsChange: (requiredCuts: RequiredCut[]) => void;
  onOptimizationParamsChange: (params: OptimizationParameters) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
}

export default function InputPanel({
  pipeSpec,
  requiredCuts,
  optimizationParams,
  onPipeSpecChange,
  onRequiredCutsChange,
  onOptimizationParamsChange,
  onOptimize,
  isOptimizing
}: InputPanelProps) {
  
  const handlePipeSpecChange = (field: keyof PipeSpecification, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      onPipeSpecChange({
        ...pipeSpec,
        [field]: field === 'material' ? value : numValue
      });
    }
  };
  
  const handleRequiredCutChange = (index: number, field: keyof RequiredCut, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const updatedCuts = [...requiredCuts];
      updatedCuts[index] = { ...updatedCuts[index], [field]: numValue };
      onRequiredCutsChange(updatedCuts);
    }
  };
  
  const handleAddRequiredCut = () => {
    onRequiredCutsChange([...requiredCuts, { length: 1000, quantity: 1 }]);
  };
  
  const handleRemoveRequiredCut = (index: number) => {
    const updatedCuts = requiredCuts.filter((_, i) => i !== index);
    onRequiredCutsChange(updatedCuts);
  };
  
  const handleOptimizationParamChange = (field: keyof OptimizationParameters, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      onOptimizationParamsChange({
        ...optimizationParams,
        [field]: numValue
      });
    }
  };
  
  const handleReset = () => {
    onPipeSpecChange({
      length: 6000,
      diameter: 48.3,
      thickness: 3.2,
      material: "Carbon Steel",
      quantity: 10
    });
    
    onRequiredCutsChange([
      { length: 1200, quantity: 12 },
      { length: 850, quantity: 8 },
      { length: 2400, quantity: 4 }
    ]);
    
    onOptimizationParamsChange({
      kerfWidth: 2.0,
      minWasteThreshold: 100,
      prioritizeWasteReduction: 70
    });
  };
  
  return (
    <div className="lg:col-span-1">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Input Specifications</h2>
          
          <form>
            {/* Stock Pipe Specifications */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 uppercase tracking-wide">Stock Pipe</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="pipe-length" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Length (mm)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="number"
                      id="pipe-length"
                      value={pipeSpec.length}
                      onChange={(e) => handlePipeSpecChange('length', e.target.value)}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">mm</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="pipe-diameter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Diameter (mm)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="number"
                      id="pipe-diameter"
                      value={pipeSpec.diameter}
                      onChange={(e) => handlePipeSpecChange('diameter', e.target.value)}
                      className="pr-12"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">mm</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="pipe-thickness" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Wall Thickness (mm)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="number"
                      id="pipe-thickness"
                      value={pipeSpec.thickness}
                      onChange={(e) => handlePipeSpecChange('thickness', e.target.value)}
                      className="pr-12"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">mm</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="pipe-material" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Material</label>
                  <select 
                    id="pipe-material" 
                    value={pipeSpec.material}
                    onChange={(e) => handlePipeSpecChange('material', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option>Carbon Steel</option>
                    <option>Stainless Steel</option>
                    <option>Aluminum</option>
                    <option>PVC</option>
                    <option>Copper</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="pipe-quantity" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Quantity Available</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="number"
                      id="pipe-quantity"
                      value={pipeSpec.quantity}
                      onChange={(e) => handlePipeSpecChange('quantity', e.target.value)}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">pcs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Required Cuts */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Required Cuts</h3>
                <Button 
                  type="button" 
                  size="icon"
                  variant="default"
                  onClick={handleAddRequiredCut}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {requiredCuts.map((cut, index) => (
                  <div key={index} className="relative bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md border border-neutral-200 dark:border-neutral-700">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-neutral-400 hover:text-destructive h-6 w-6"
                      onClick={() => handleRemoveRequiredCut(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`cut-length-${index}`} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Length (mm)</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <Input
                            type="number"
                            id={`cut-length-${index}`}
                            value={cut.length}
                            onChange={(e) => handleRequiredCutChange(index, 'length', e.target.value)}
                            className="pr-12"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">mm</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor={`cut-quantity-${index}`} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Quantity</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <Input
                            type="number"
                            id={`cut-quantity-${index}`}
                            value={cut.quantity}
                            onChange={(e) => handleRequiredCutChange(index, 'quantity', e.target.value)}
                            className="pr-12"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">pcs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Optimization Parameters */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 uppercase tracking-wide">Optimization Parameters</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="kerf-width" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Kerf Width (mm)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="number"
                      id="kerf-width"
                      value={optimizationParams.kerfWidth}
                      onChange={(e) => handleOptimizationParamChange('kerfWidth', e.target.value)}
                      className="pr-12"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">mm</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="min-waste" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Minimum Waste Threshold (mm)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="number"
                      id="min-waste"
                      value={optimizationParams.minWasteThreshold}
                      onChange={(e) => handleOptimizationParamChange('minWasteThreshold', e.target.value)}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 dark:text-neutral-400 sm:text-sm">mm</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <label htmlFor="weight-waste" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Prioritize Waste Reduction</label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{optimizationParams.prioritizeWasteReduction}%</span>
                  </div>
                  <Slider
                    id="weight-waste"
                    value={[optimizationParams.prioritizeWasteReduction]}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                    onValueChange={(value) => handleOptimizationParamChange('prioritizeWasteReduction', value[0])}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={handleReset} className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              <Button 
                type="button" 
                variant="default" 
                onClick={onOptimize}
                disabled={isOptimizing}
                className="flex items-center"
              >
                {isOptimizing ? (
                  <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Optimizing...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-1" /> Optimize Cuts</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
