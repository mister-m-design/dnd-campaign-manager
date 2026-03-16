"use client";

import React, { useEffect, useState } from 'react';
import CharacterCreator from '@/components/CharacterCreator';
import { useParams, useRouter } from 'next/navigation';
import { usePersistentState } from '@/hooks/usePersistentState';

export default function EditCharacterPage() {
    const params = useParams();
    const router = useRouter();
    const [savedCharacters] = usePersistentState<any[]>('mythic_saved_characters', []);
    const [characterToEdit, setCharacterToEdit] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id && savedCharacters.length > 0) {
            const char = savedCharacters.find(c => c.id === params.id);
            if (char) {
                setCharacterToEdit(char);
            } else {
                alert('Character not found');
                router.push('/characters');
            }
            setIsLoading(false);
        } else if (savedCharacters.length > 0) {
            setIsLoading(false);
        }
    }, [params.id, savedCharacters, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <div className="animate-pulse text-primary font-black uppercase tracking-[0.3em]">Loading Hero...</div>
            </div>
        );
    }

    if (!characterToEdit) {
        return null;
    }

    return (
        <main className="min-h-screen bg-[#050505] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Edit Your Hero</h1>
                </div>

                <CharacterCreator initialData={characterToEdit} isEditing={true} />
            </div>
        </main>
    );
}
