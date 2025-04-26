import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Save, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OptimizationResult, PipeSpecification } from "@/lib/optimization";
import PipeVisualization from "./pipe-visualization";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import 'jspdf-autotable';

interface OptimizationResultsProps {
  results: OptimizationResult | null | undefined;
  loading: boolean;
  pipeSpec?: PipeSpecification;
}

export default function OptimizationResults({ results, loading, pipeSpec }: OptimizationResultsProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const cutItemsPerPage = 10;
  const visualizationRef = useRef<HTMLDivElement>(null);
  
  if (loading) {
    return (
      <div className="lg:col-span-2">
        <Card>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">Optimizing pipe cutting patterns...</p>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">This may take a few moments</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="lg:col-span-2">
        <Card>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <svg className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">No optimization results yet</p>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">Configure your pipe specifications and click 'Optimize Cuts'</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // Extract all cuts from all patterns for the table
  const allCuts = results.results.flatMap((pattern, pipeIndex) => 
    pattern.cuts.map((cut, cutIndex) => ({
      pipeIndex: pattern.pipeIndex + 1,
      cutSequence: cutIndex + 1,
      length: cut.length,
      startPos: cut.startPos,
      endPos: cut.endPos
    }))
  );
  
  // Paginate cuts
  const totalPages = Math.ceil(allCuts.length / cutItemsPerPage);
  const paginatedCuts = allCuts.slice(
    (currentPage - 1) * cutItemsPerPage,
    currentPage * cutItemsPerPage
  );
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  // Function to generate and download PDF report
  const generatePDF = async () => {
    if (!results || !visualizationRef.current) return;
    
    try {
      setExportLoading(true);
      
      // Create new PDF document
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('Pipe Cutting Optimization Report', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
      
      // Add summary data
      pdf.setFontSize(14);
      pdf.text('Summary', 14, 35);
      
      const summaryData = [
        ['Total Pipes Used', `${results.pipesUsed}`],
        ['Material Efficiency', `${results.materialEfficiency.toFixed(1)}%`],
        ['Total Waste', `${results.totalWaste} mm`],
        ['Cut Operations', `${results.cutOperations}`]
      ];
      
      // @ts-ignore - jsPDF-autoTable types
      pdf.autoTable({
        startY: 40,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 40 }
      });
      
      // Pipe specifications
      if (pipeSpec) {
        pdf.setFontSize(14);
        pdf.text('Pipe Specifications', 14, pdf.autoTable.previous.finalY + 15);
        
        const pipeSpecData = [
          ['Length', `${pipeSpec.length} mm`],
          ['Diameter', `${pipeSpec.diameter} mm`],
          ['Thickness', `${pipeSpec.thickness} mm`],
          ['Material', pipeSpec.material],
          ['Quantity', `${pipeSpec.quantity}`]
        ];
        
        // @ts-ignore - jsPDF-autoTable types
        pdf.autoTable({
          startY: pdf.autoTable.previous.finalY + 20,
          head: [['Property', 'Value']],
          body: pipeSpecData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        });
      }
      
      // Add visualization
      pdf.setFontSize(14);
      pdf.text('Cutting Pattern Visualization', 14, pdf.autoTable.previous.finalY + 15);
      
      // Convert visualization to image
      const canvas = await html2canvas(visualizationRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit within page width
      const imgWidth = 180;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 15, pdf.autoTable.previous.finalY + 20, imgWidth, imgHeight);
      
      // Add detailed cuts table
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Detailed Cutting List', 14, 20);
      
      const cutsData = allCuts.map(cut => [
        `${cut.pipeIndex}`,
        `${cut.cutSequence}`,
        `${cut.length} mm`,
        `${cut.startPos} mm`,
        `${cut.endPos} mm`
      ]);
      
      // @ts-ignore - jsPDF-autoTable types
      pdf.autoTable({
        startY: 25,
        head: [['Pipe No.', 'Cut Sequence', 'Length (mm)', 'Start Position (mm)', 'End Position (mm)']],
        body: cutsData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 25 }
      });
      
      // Save PDF
      pdf.save('pipe-cutting-optimization-report.pdf');
      
      toast({
        title: "PDF Export Successful",
        description: "Your optimization report has been downloaded",
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Export Failed",
        description: "There was an error generating the PDF report",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };
  
  return (
    <div className="lg:col-span-2">
      <Card className="overflow-hidden">
        {/* Results Header */}
        <CardHeader className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between items-center">
            <CardTitle>Optimization Results</CardTitle>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex items-center">
                <Share2 className="h-4 w-4 mr-1" />
                <span>Share</span>
              </Button>
              
              <Button variant="outline" size="sm" className="flex items-center">
                <Save className="h-4 w-4 mr-1" />
                <span>Save</span>
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                className="flex items-center" 
                onClick={generatePDF}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    <span>Export PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Results Summary */}
        <div className="p-6 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-sm">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Pipes Used</div>
              <div className="mt-1 flex items-end">
                <div className="text-2xl font-semibold text-neutral-900 dark:text-white">{results.pipesUsed}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 ml-2">of {results.results[0].pipeIndex + results.pipesUsed}</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-sm">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Material Efficiency</div>
              <div className="mt-1 flex items-end">
                <div className="text-2xl font-semibold text-green-600 dark:text-green-500">{results.materialEfficiency.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-sm">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Waste</div>
              <div className="mt-1 flex items-end">
                <div className="text-2xl font-semibold text-neutral-900 dark:text-white">{results.totalWaste}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 ml-2">mm</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-sm">
              <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Cut Operations</div>
              <div className="mt-1 flex items-end">
                <div className="text-2xl font-semibold text-neutral-900 dark:text-white">{results.cutOperations}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Visualization */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4 uppercase tracking-wide">Cutting Pattern Visualization</h3>
          
          <div ref={visualizationRef}>
            <PipeVisualization 
              results={results.results} 
              stockLength={pipeSpec ? pipeSpec.length : 100} // Use pipe spec length or default to 100mm
            />
          </div>
        </div>
        
        {/* Detailed Results Table */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4 uppercase tracking-wide">Detailed Cutting List</h3>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pipe No.</TableHead>
                  <TableHead>Cut Sequence</TableHead>
                  <TableHead>Length (mm)</TableHead>
                  <TableHead>Start Position (mm)</TableHead>
                  <TableHead>End Position (mm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCuts.map((cut, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{cut.pipeIndex}</TableCell>
                    <TableCell>{cut.cutSequence}</TableCell>
                    <TableCell>{cut.length}</TableCell>
                    <TableCell>{cut.startPos}</TableCell>
                    <TableCell>{cut.endPos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
