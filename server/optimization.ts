export interface PipeSpecification {
  length: number;
  diameter: number;
  thickness: number;
  material: string;
  quantity: number;
}

export interface RequiredCut {
  length: number;
  quantity: number;
}

export interface OptimizationParameters {
  kerfWidth: number;
  minWasteThreshold: number;
  prioritizeWasteReduction: number;  // 0-100 scale
}

export interface CutDetail {
  length: number;
  startPos: number;
  endPos: number;
}

export interface PipeCuttingPattern {
  pipeIndex: number;
  cuts: CutDetail[];
  waste: number;
}

export interface OptimizationResult {
  pipesUsed: number;
  materialEfficiency: number;
  totalWaste: number;
  cutOperations: number;
  results: PipeCuttingPattern[];
  parameters: OptimizationParameters;
}

// Function to optimize pipe cutting
export function optimizePipeCutting(
  pipeSpec: PipeSpecification,
  requiredCuts: RequiredCut[],
  params: OptimizationParameters
): OptimizationResult {
  // Sort required cuts by length in descending order for better packing
  const sortedCuts: { length: number; quantity: number; remaining: number }[] = requiredCuts
    .map(cut => ({ ...cut, remaining: cut.quantity }))
    .sort((a, b) => b.length - a.length);
  
  const stockLength = pipeSpec.length;
  const patterns: PipeCuttingPattern[] = [];
  
  let pipeIndex = 0;
  let totalCutOperations = 0;
  let totalWaste = 0;
  
  // Continue until all required cuts are satisfied
  while (sortedCuts.some(cut => cut.remaining > 0) && pipeIndex < pipeSpec.quantity) {
    const currentPipe: PipeCuttingPattern = {
      pipeIndex,
      cuts: [],
      waste: 0
    };
    
    let remainingLength = stockLength;
    let currentPosition = 0;
    
    // Try to fit cuts into the current pipe
    for (const cut of sortedCuts) {
      while (cut.remaining > 0 && remainingLength >= cut.length + params.kerfWidth) {
        // Add this cut to the pattern
        currentPipe.cuts.push({
          length: cut.length,
          startPos: currentPosition,
          endPos: currentPosition + cut.length
        });
        
        // Update position and remaining length
        currentPosition += cut.length + params.kerfWidth;
        remainingLength -= (cut.length + params.kerfWidth);
        cut.remaining--;
        totalCutOperations++;
      }
    }
    
    // Calculate waste for this pipe
    currentPipe.waste = remainingLength;
    totalWaste += remainingLength;
    
    // Add this pipe's pattern to results
    patterns.push(currentPipe);
    pipeIndex++;
  }
  
  // Calculate material efficiency
  const totalPipeLength = pipeIndex * stockLength;
  const usedLength = totalPipeLength - totalWaste;
  const materialEfficiency = (usedLength / totalPipeLength) * 100;
  
  return {
    pipesUsed: pipeIndex,
    materialEfficiency: Math.round(materialEfficiency * 10) / 10, // Round to 1 decimal place
    totalWaste,
    cutOperations: totalCutOperations,
    results: patterns,
    parameters: params
  };
}

// Function to run optimization on multiple pipe specs
export function runOptimization(
  pipeSpecs: any[], 
  requiredCuts: any[],
  params: OptimizationParameters = {
    kerfWidth: 2.0,
    minWasteThreshold: 100,
    prioritizeWasteReduction: 70
  }
): OptimizationResult {
  // For simplicity, we'll use the first pipe spec for optimization
  // In a real-world scenario, we'd optimize across multiple pipe specs
  if (pipeSpecs.length === 0) {
    throw new Error("No pipe specifications provided");
  }
  
  const primaryPipeSpec: PipeSpecification = {
    length: pipeSpecs[0].length,
    diameter: pipeSpecs[0].diameter,
    thickness: pipeSpecs[0].thickness,
    material: pipeSpecs[0].material,
    quantity: pipeSpecs[0].quantity
  };
  
  const formattedRequiredCuts: RequiredCut[] = requiredCuts.map(cut => ({
    length: cut.length,
    quantity: cut.quantity
  }));
  
  return optimizePipeCutting(primaryPipeSpec, formattedRequiredCuts, params);
}