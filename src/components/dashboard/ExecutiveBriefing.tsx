'use client';

import { useRef } from 'react';
import { Sparkles, ArrowRight, BrainCircuit, Lightbulb, Download } from 'lucide-react';
import type { ExecutiveBriefing } from '@/lib/ai/openai-client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function ExecutiveBriefingView({ briefing }: { briefing?: ExecutiveBriefing | null }) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = async () => {
        if (!containerRef.current || !briefing) return;

        try {
            const canvas = await html2canvas(containerRef.current, {
                scale: 2,
                backgroundColor: '#111111', // Enforce dark background
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            // Create PDF with dimensions matching the canvas
            // Using pixels as unit
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Escalate_Briefing_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    if (!briefing) {
        return (
            <div className="bg-[#111111] border border-[#ffffff10] rounded-xl p-6 mb-8 flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <BrainCircuit className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-white">Generating Insights...</h3>
                <p className="text-gray-400 mt-2 text-center max-w-sm">
                    Analyzing campaign data, calculating trends, and identifying opportunities.
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="bg-gradient-to-br from-[#111111] to-[#0A0A0A] border border-[#ffffff10] rounded-xl p-6 mb-8 relative overflow-hidden group/card shadow-2xl shadow-black/50">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Executive Briefing</h2>
                        <span className="text-xs text-blue-400/80 font-medium">Daily Intelligence Report</span>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-mono hidden sm:inline-block">
                            {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <button
                            onClick={handleExportPDF}
                            className="p-2 rounded-lg bg-[#ffffff05] hover:bg-[#ffffff10] text-gray-400 hover:text-white transition-colors border border-[#ffffff05] group/btn"
                            title="Export as PDF"
                            data-html2canvas-ignore="true" // Ignore this button in PDF
                        >
                            <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="mb-6 pl-1">
                    <p className="text-gray-300 leading-relaxed text-lg border-l-2 border-blue-500/30 pl-4 py-1">
                        {briefing.summary}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#ffffff03] rounded-xl p-4 border border-[#ffffff05]">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Key Insights <div className="h-px bg-[#ffffff10] flex-1" />
                        </h4>
                        <ul className="space-y-3">
                            {briefing.keyInsights.map((insight, i) => (
                                <li key={i} className="flex gap-3 text-gray-300 text-sm group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 group-hover:bg-blue-400 transition-colors shadow shadow-blue-500/50" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-[#ffffff03] rounded-xl p-4 border border-[#ffffff05]">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Top Opportunities <div className="h-px bg-[#ffffff10] flex-1" />
                        </h4>
                        <ul className="space-y-3">
                            {briefing.topOpportunities.map((opp, i) => (
                                <li key={i} className="flex gap-3 text-emerald-100 text-sm bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
                                    <Lightbulb className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    {opp}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {briefing.warnings.length > 0 && (
                    <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                        <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            Attention Required
                        </h4>
                        <ul className="space-y-1">
                            {briefing.warnings.map((warning, i) => (
                                <li key={i} className="text-red-200/90 text-sm flex items-center gap-2">
                                    <div className="w-1 h-1 bg-red-500 rounded-full" />
                                    {warning}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
