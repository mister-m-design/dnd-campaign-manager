import React from 'react';
import { BuilderStep, STEPS } from '@/hooks/useCharacterBuilder';

interface BuilderSidebarProps {
    currentStep: BuilderStep;
    setStep: (step: BuilderStep) => void;
}

export default function BuilderSidebar({ currentStep, setStep }: BuilderSidebarProps) {
    return (
        <aside className="w-72 p-6 flex flex-col" style={{ background: 'var(--panel-bg)', borderRight: '1px solid var(--panel-border)' }}>
            <div className="mb-12">
                <h1 className="text-2xl font-black italic uppercase tracking-tighter">Forge Hero</h1>
                <div className="h-1 w-12 bg-primary mt-2" />
            </div>
            
            <nav className="flex-grow space-y-2">
                {STEPS.map((s, i) => {
                    const active = currentStep === s.id;
                    const indexInSteps = STEPS.findIndex(step => step.id === s.id);
                    const currentIndex = STEPS.findIndex(step => step.id === currentStep);
                    const completed = indexInSteps < currentIndex;

                    return (
                        <button 
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 group ${active ? 'bg-primary/10 text-primary translate-x-1' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <div className={`size-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' : completed ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-600 group-hover:bg-white/10'}`}>
                                <span className={`material-symbols-outlined text-sm ${completed && !active ? 'font-bold' : ''}`}>
                                    {completed && !active ? 'check' : s.icon}
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                        </button>
                    );
                })}
            </nav>
            
            <div className="mt-auto pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 px-4">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">Rules Engine Active</span>
                </div>
            </div>
        </aside>
    );
}
