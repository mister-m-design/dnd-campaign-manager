import CombatTracker from '@/components/CombatTracker';
import { Suspense } from 'react';

export default function CombatPage() {
    return (
        <main className="min-h-screen pt-12">
            <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-500 font-bold uppercase tracking-widest">Initialising Combat Matrix...</div>}>
                <CombatTracker />
            </Suspense>
        </main>
    );
}
