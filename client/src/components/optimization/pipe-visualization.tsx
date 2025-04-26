import { useEffect, useRef } from 'react';
import { PipeCuttingPattern } from '@/lib/optimization';

interface PipeVisualizationProps {
  results: PipeCuttingPattern[];
  stockLength: number;
}

const PipeVisualization = ({ results, stockLength }: PipeVisualizationProps) => {
  
  const calculatePercentage = (length: number) => {
    return (length / stockLength) * 100;
  };
  
  // Check if any results are available
  if (!results || results.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 bg-neutral-100 dark:bg-neutral-800 rounded-md">
        <span className="text-neutral-500 dark:text-neutral-400">No cutting patterns available</span>
      </div>
    );
  }

  return (
    <div className="pipe-visualization" id="pipe-visualization">
      {results.map((pipe, pipeIndex) => (
        <div key={pipeIndex} className="flex items-center mb-6">
          <div className="w-14 text-right pr-2">
            <span className="text-sm font-mono text-neutral-500 dark:text-neutral-400">Pipe {pipe.pipeIndex + 1}</span>
          </div>
          <div className="flex-grow">
            <div className="pipe h-12 bg-neutral-200 dark:bg-neutral-700 rounded-md relative overflow-hidden">
              {/* Pipe cut sections - render each cut piece */}
              {pipe.cuts.map((cut, cutIndex) => {
                // Calculate the width and position as percentages
                const width = calculatePercentage(cut.length);
                const left = calculatePercentage(cut.startPos);
                
                return (
                  <div
                    key={cutIndex}
                    className="pipe-cut absolute h-full bg-blue-500 dark:bg-blue-600 border-r border-neutral-100 dark:border-neutral-800"
                    style={{
                      width: `${width}%`,
                      left: `${left}%`,
                    }}
                    title={`${cut.length}mm (${cut.startPos}mm - ${cut.endPos}mm)`}
                  >
                    <div className="h-full flex items-center justify-center overflow-hidden">
                      {width > 5 && (
                        <span className="text-xs text-white font-medium truncate px-2">
                          {cut.length}mm
                        </span>
                      )}
                    </div>
                    {/* Kerf indication */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 bg-neutral-700 dark:bg-neutral-900 opacity-50"
                    ></div>
                  </div>
                );
              })}
              
              {/* Waste section - render at the end of each pipe if there's waste */}
              {pipe.waste > 0 && (
                <div
                  className="pipe-waste absolute h-full rounded-r-md"
                  style={{
                    width: `${calculatePercentage(pipe.waste)}%`,
                    right: '0',
                    background: 'repeating-linear-gradient(45deg, rgba(232, 121, 23, 0.6), rgba(232, 121, 23, 0.6) 6px, rgba(232, 121, 23, 0.8) 6px, rgba(232, 121, 23, 0.8) 12px)'
                  }}
                  title={`Waste: ${pipe.waste}mm`}
                >
                  {calculatePercentage(pipe.waste) > 5 && (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium px-2">
                        {pipe.waste}mm
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-20 text-left pl-2">
            <span className={`text-xs font-mono ${pipe.waste === 0 ? 'text-green-600 dark:text-green-500' : pipe.waste > 10 ? 'text-orange-600 dark:text-orange-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {pipe.waste}mm waste
            </span>
          </div>
        </div>
      ))}
      
      {/* Legend */}
      <div className="flex items-center justify-end mt-4 space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 mr-2"></div>
          <span className="text-xs text-neutral-700 dark:text-neutral-300">Cut Piece</span>
        </div>
        <div className="flex items-center">
          <div 
            className="w-4 h-4 mr-2" 
            style={{
              background: 'repeating-linear-gradient(45deg, rgba(232, 121, 23, 0.6), rgba(232, 121, 23, 0.6) 3px, rgba(232, 121, 23, 0.8) 3px, rgba(232, 121, 23, 0.8) 6px)'
            }}
          ></div>
          <span className="text-xs text-neutral-700 dark:text-neutral-300">Waste</span>
        </div>
      </div>
    </div>
  );
};

export default PipeVisualization;
