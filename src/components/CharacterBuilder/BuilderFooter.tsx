import React from 'react';
import { BuilderStep } from '@/hooks/useCharacterBuilder';

interface BuilderFooterProps {
    currentStep: BuilderStep;
    prevStep: () => void;
    nextStep: () => void;
    handleSave: () => void;
}

export default function BuilderFooter({ currentStep, prevStep, nextStep, handleSave }: BuilderFooterProps) {
    const isFirstStep = currentStep === 'identity';
    const isFinalStep = currentStep === 'review';

    return (
        <footer className="h-20 px-8 flex items-center justify-between" style={{ background: 'var(--panel-bg)', borderTop: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}>
            <button 
                onClick={prevStep}
                disabled={isFirstStep}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isFirstStep ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-white'}`}
            >
                Back Phase
            </button>
            
            <button 
                onClick={isFinalStep ? handleSave : nextStep}
                className="bg-primary text-black px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:scale-105 active:scale-95 transition-all primary-glow"
            >
                {isFinalStep ? 'Enter World' : 'Initiate Next Phase'}
            </button>
        </footer>
    );
}
