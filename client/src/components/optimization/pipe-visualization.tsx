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
  
  return (
    <div className="pipe-visualization">
      {results.map((pipe, pipeIndex) => (
        <div key={pipeIndex} className="flex items-center mb-4">
          <div className="w-14 text-right pr-2">
            <span className="text-sm font-mono text-neutral-500 dark:text-neutral-400">Pipe {pipe.pipeIndex + 1}</span>
          </div>
          <div className="flex-grow">
            <div className="pipe h-12 bg-neutral-200 dark:bg-neutral-700 rounded-md relative">
              {pipe.cuts.map((cut, cutIndex) => (
                <div
                  key={cutIndex}
                  className="pipe-cut absolute h-full bg-primary border-r-2 border-dashed border-primary-200 dark:border-primary-900"
                  style={{
                    width: `${calculatePercentage(cut.length)}%`,
                    left: `${calculatePercentage(cut.startPos)}%`,
                  }}
                  title={`${cut.length}mm (${cut.startPos}mm - ${cut.endPos}mm)`}
                >
                  <div className="h-full flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-white font-medium truncate px-2">
                      {cut.length}mm
                    </span>
                  </div>
                </div>
              ))}
              {pipe.waste > 0 && (
                <div
                  className="pipe-waste absolute h-full rounded-r-md"
                  style={{
                    width: `${calculatePercentage(pipe.waste)}%`,
                    left: `${calculatePercentage(stockLength - pipe.waste)}%`,
                    background: 'repeating-linear-gradient(45deg, rgba(255, 143, 0, 0.3), rgba(255, 143, 0, 0.3) 5px, rgba(255, 143, 0, 0.5) 5px, rgba(255, 143, 0, 0.5) 10px)'
                  }}
                  title={`Waste: ${pipe.waste}mm`}
                ></div>
              )}
            </div>
          </div>
          <div className="w-16 text-left pl-2">
            <span className={`text-xs font-mono ${pipe.waste === 0 ? 'text-green-600 dark:text-green-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {pipe.waste}mm waste
            </span>
          </div>
        </div>
      ))}
      
      {/* Legend */}
      <div className="flex items-center justify-end mt-4 space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-primary mr-2"></div>
          <span className="text-xs text-neutral-700 dark:text-neutral-300">Cut Piece</span>
        </div>
        <div className="flex items-center">
          <div 
            className="w-4 h-4 mr-2" 
            style={{
              background: 'repeating-linear-gradient(45deg, rgba(255, 143, 0, 0.3), rgba(255, 143, 0, 0.3) 2px, rgba(255, 143, 0, 0.5) 2px, rgba(255, 143, 0, 0.5) 4px)'
            }}
          ></div>
          <span className="text-xs text-neutral-700 dark:text-neutral-300">Waste</span>
        </div>
      </div>
    </div>
  );
};

export default PipeVisualization;
