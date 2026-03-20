"use client";

import React, { useEffect, useState } from 'react';
import CharacterBuilder from '@/components/CharacterBuilder/CharacterBuilder';
import { useParams, useRouter } from 'next/navigation';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Character } from '@/types';

export default function EditCharacterPage() {
    const params = useParams();
    const router = useRouter();
    const [savedCharacters] = usePersistentState<Character[]>('mythic_saved_characters', []);
    const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);
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

    return <CharacterBuilder initialData={characterToEdit} isEditing={true} />;
}
