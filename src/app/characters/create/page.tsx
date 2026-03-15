import CharacterCreator from '@/components/CharacterCreator';

export default function CharacterCreationPage() {
    return (
        <main className="min-h-screen pt-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter">Forge Your Hero</h1>
                    <p className="text-slate-400 mt-2">Create a new character for your journey through the realms.</p>
                </div>
                <CharacterCreator />
            </div>
        </main>
    );
}
