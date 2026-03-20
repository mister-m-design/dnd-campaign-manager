import CombatTracker from '@/components/CombatTracker';
import { Suspense } from 'react';

export default function CombatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500 font-bold uppercase tracking-widest bg-[#020617]">Initialising Combat Matrix...</div>}>
            <CombatTracker />
        </Suspense>
    );
}
