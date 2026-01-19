import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Circle, FileSearch, BrainCircuit, PenTool } from 'lucide-react';

const AnalysisLoading = () => {
    // Rotating status text state
    const [currentStep, setCurrentStep] = useState(0);

    // Simulation steps
    const steps = [
        { 
            icon: FileSearch, 
            label: "코드 구조 분석 중...", 
            desc: "파일의 구조와 문법을 파악하고 있습니다." 
        },
        { 
            icon: BrainCircuit, 
            label: "AI 전문가 검토 중...", 
            desc: "코드 스멜과 잠재적인 버그를 찾아내는 중입니다." 
        },
        { 
            icon: PenTool, 
            label: "최종 리포트 작성 중...", 
            desc: "개선 제안과 상세 설명을 정리하고 있습니다." 
        }
    ];

    useEffect(() => {
        // Simple timer to simulate progress through steps
        // Total expected time is around 10-20 seconds for simulation feeling
        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev < steps.length - 1) return prev + 1;
                return prev;
            });
        }, 4000); // Move to next step every 4 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="rounded-lg shadow-sm border border-[#e2e8f0] dark:border-[#3f3f46] p-6">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 animate-pulse"></div>
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            AI 분석 진행 중
                        </h2>
                        <p className="text-sm mt-1 animate-pulse">
                            잠시만 기다려주세요. 상세한 리포트를 작성하고 있습니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* A. Progress Stepper */}
            <div className="mb-10 px-4">
                <div className="flex justify-between items-center relative">
                    {/* Progress Line Background */}
                    <div className="absolute left-0 top-1/2 w-full h-1-z-10 rounded"></div>
                    
                    {/* Active Progress Line */}
                    <div 
                        className="absolute left-0 top-1/2 h-1 -z-10 rounded transition-all duration-1000 ease-in-out"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = idx === currentStep;
                        const isCompleted = idx < currentStep;

                        return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500'}
                                `}>
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />}
                                </div>
                                <div className="text-center">
                                    <div className={`text-sm font-semibold `}>
                                        {step.label}
                                    </div>
                                    {isActive && (
                                        <div className="text-xs text-indigo-500 mt-1 font-medium animate-fadeIn">
                                            {step.desc}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* B. Skeleton UI */}
            <div className="space-y-6 opacity-60 pointer-events-none select-none filter blur-[1px] transition-all duration-1000">
                {/* Score Badge Skeleton */}
                <div className="flex justify-between items-center">
                    <div className="h-8 w-32 rounded animate-pulse"></div>
                    <div className="h-8 w-24 rounded-full animate-pulse"></div>
                </div>

                {/* Code Smells Skeleton */}
                <div className="space-y-3">
                    <div className="h-6 w-48 rounded animate-pulse mb-4"></div>
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-100 rounded-lg bg-gray-50 flex gap-4">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 rounded animate-pulse"></div>
                                <div className="h-3 w-3/4 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Suggestions Skeleton */}
                <div className="space-y-4 pt-4">
                    <div className="h-6 w-40 rounded animate-pulse mb-4"></div>
                     <div className="border rounded-lg overflow-hidden">
                        <div className="p-3 border-b bg-gray-50 h-10 animate-pulse"></div>
                        <div className="p-4 space-y-4">
                            <div className="h-20 rounded animate-pulse"></div>
                            <div className="h-20 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisLoading;
