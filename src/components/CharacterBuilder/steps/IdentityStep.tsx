
import React from 'react';
import { Character } from '@/types';

interface IdentityStepProps {
    char: Character;
    updateIdentity: (field: keyof Character, value: any) => void;
}

export default function IdentityStep({ char, updateIdentity }: IdentityStepProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [speciesList, setSpeciesList] = React.useState<any[]>([]);
    const [backgroundList, setBackgroundList] = React.useState<any[]>([]);
    const [searchTermSpecies, setSearchTermSpecies] = React.useState(char.species || '');
    const [searchTermBackground, setSearchTermBackground] = React.useState(char.background || '');

    React.useEffect(() => {
        fetch('/data/species.json').then(res => res.json()).then(setSpeciesList);
        fetch('/data/backgrounds.json').then(res => res.json()).then(setBackgroundList);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateIdentity('imageUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const applyQuickBuild = () => {
        const names = ['Thorne', 'Lyra', 'Kaelen', 'Morgrit', 'Sariel', 'Vax', 'Keyleth'];
        const randomSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
        const randomBackground = backgroundList[Math.floor(Math.random() * backgroundList.length)];
        
        updateIdentity('name', names[Math.floor(Math.random() * names.length)]);
        if (randomSpecies) {
            updateIdentity('species', randomSpecies.name);
            updateIdentity('speed', randomSpecies.speed);
            setSearchTermSpecies(randomSpecies.name);
        }
        if (randomBackground) {
            updateIdentity('background', randomBackground.name);
            setSearchTermBackground(randomBackground.name);
        }
    };

    const filteredSpecies = speciesList.filter(s => 
        s.name.toLowerCase().includes(searchTermSpecies.toLowerCase())
    ).slice(0, 10);
    
    const filteredBackgrounds = backgroundList.filter(b => 
        b.name.toLowerCase().includes(searchTermBackground.toLowerCase())
    ).slice(0, 10);

    return (
        <div className="space-y-12">
            <div className="border-b border-white/10 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Identity & Origin</h2>
                    <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">Foundations of your Legend</p>
                </div>
                <button 
                    onClick={applyQuickBuild}
                    className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-primary underline decoration-primary/30 underline-offset-4"
                >
                    Quick Build Identity
                </button>
            </div>
            
            {/* Hidden file input — hoisted so portrait button can reach it */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── Hero card: Portrait + Name + Level ── */}
                <div className="md:col-span-2 flex gap-5 items-stretch bg-white/[0.02] p-5 rounded-3xl border border-white/5">
                    {/* Portrait thumbnail — clickable */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Click to upload portrait"
                        className="size-28 rounded-2xl bg-slate-900 border-2 border-dashed border-white/10 flex-shrink-0 relative overflow-hidden group hover:border-primary/50 cursor-pointer transition-all flex items-center justify-center self-stretch"
                    >
                        {char.imageUrl ? (
                            <>
                                <img
                                    src={char.imageUrl}
                                    alt="Portrait"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-xl">edit</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-3">
                                <span className="material-symbols-outlined text-slate-600 group-hover:text-primary text-2xl mb-1 transition-colors block">add_a_photo</span>
                                <p className="text-[7px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest transition-colors leading-tight">Click to<br/>Upload</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>

                    {/* Name + Level + URL input */}
                    <div className="flex-grow flex flex-col gap-3 min-w-0">
                        {/* Name + Level row */}
                        <div className="flex gap-3 items-end">
                            <div className="flex-grow space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Character Name</label>
                                <input
                                    value={char.name}
                                    onChange={e => updateIdentity('name', e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-primary outline-none transition-all text-lg"
                                    placeholder="Enter name..."
                                />
                            </div>
                            <div className="space-y-1.5 w-20 shrink-0">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block text-center">Level</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={char.level}
                                    onChange={e => updateIdentity('level', parseInt(e.target.value) || 1)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-2 py-3 font-black text-white focus:border-primary outline-none text-2xl text-center"
                                />
                            </div>
                        </div>

                        {/* Portrait URL / browse row — compact, inline */}
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-grow">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">link</span>
                                <input
                                    value={char.imageUrl || ''}
                                    onChange={e => updateIdentity('imageUrl', e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-white focus:border-primary outline-none transition-all placeholder:text-slate-700 text-xs font-medium"
                                    placeholder="Paste portrait URL…"
                                />
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-primary/30 transition-all text-slate-400 hover:text-primary whitespace-nowrap active:scale-95 shrink-0"
                            >
                                <span className="material-symbols-outlined text-sm">upload_file</span>
                                Browse
                            </button>
                        </div>
                    </div>
                </div>

                {/* Species Selection */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Species</label>
                        {char.species && <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-1 rounded-md">{char.species} Selected</span>}
                    </div>
                    
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-slate-500 text-sm">search</span>
                        <input 
                            value={searchTermSpecies}
                            onChange={e => setSearchTermSpecies(e.target.value)}
                            placeholder="Find a species (Kobold, Elf...)"
                            className="w-full bg-slate-900 border border-white/10 rounded-t-xl px-4 py-3 pl-10 text-sm font-bold text-white focus:border-primary outline-none transition-all"
                        />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto bg-slate-900/50 border-x border-b border-white/10 rounded-b-xl custom-scrollbar divide-y divide-white/5">
                        {filteredSpecies.map(s => (
                            <button
                                key={s.name}
                                onClick={() => {
                                    updateIdentity('species', s.name);
                                    updateIdentity('speed', s.speed);
                                    updateIdentity('speciesTraits', s.features);
                                    setSearchTermSpecies(s.name);
                                }}
                                className={`w-full text-left p-4 hover:bg-white/5 transition-all flex items-center justify-between group ${char.species === s.name ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                            >
                                <div className="flex-grow pr-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`font-black uppercase text-[11px] tracking-wider ${char.species === s.name ? 'text-primary' : 'text-slate-200'}`}>{s.name}</p>
                                            <p className="text-[9px] text-slate-500 mt-0.5">{s.size} • {s.speed}ft Speed</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {s.features?.slice(0, 2).map((t: any) => (
                                                <span key={t.name} className="text-[7px] bg-white/5 text-slate-400 px-1 py-0.5 rounded border border-white/5 uppercase font-bold">{t.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {char.species === s.name && s.features?.length > 0 && (
                                        <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 duration-300">
                                            {s.features.map((t: any) => (
                                                <div key={t.name} className="bg-black/20 p-2 rounded-lg border border-white/5">
                                                    <p className="text-[8px] font-black text-primary uppercase mb-1">{t.name}</p>
                                                    <p className="text-[8px] text-slate-400 leading-relaxed">{t.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className={`material-symbols-outlined text-sm transition-all ${char.species === s.name ? 'text-primary scale-125' : 'text-slate-700 opacity-0 group-hover:opacity-100'}`}>check_circle</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Background Selection */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Background (Origin)</label>
                        {char.background && <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-1 rounded-md">{char.background} Selected</span>}
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-slate-500 text-sm">search</span>
                        <input 
                            value={searchTermBackground}
                            onChange={e => setSearchTermBackground(e.target.value)}
                            placeholder="Choose your origin..."
                            className="w-full bg-slate-900 border border-white/10 rounded-t-xl px-4 py-3 pl-10 text-sm font-bold text-white focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto bg-slate-900/50 border-x border-b border-white/10 rounded-b-xl custom-scrollbar divide-y divide-white/5">
                        {filteredBackgrounds.map(b => (
                            <button
                                key={b.name}
                                onClick={() => {
                                    updateIdentity('background', b.name);
                                    setSearchTermBackground(b.name);
                                }}
                                className={`w-full text-left p-4 hover:bg-white/5 transition-all flex flex-col group ${char.background === b.name ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-black uppercase text-[11px] tracking-wider ${char.background === b.name ? 'text-primary' : 'text-slate-200'}`}>{b.name}</p>
                                        <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-black border border-white/5">{b.feat}</span>
                                    </div>
                                    <span className={`material-symbols-outlined text-sm transition-all ${char.background === b.name ? 'text-primary scale-125' : 'text-slate-700 opacity-0 group-hover:opacity-100'}`}>check_circle</span>
                                </div>
                                <p className={`text-[9px] leading-relaxed transition-all ${char.background === b.name ? 'text-slate-300 h-auto opacity-100 mt-2' : 'text-slate-500 line-clamp-1'}`}>
                                    {b.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-4">Alignment</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'].map(align => (
                            <button
                                key={align}
                                onClick={() => updateIdentity('alignment', align)}
                                className={`px-4 py-2.5 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all ${char.alignment === align
                                    ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                                    }`}
                            >
                                {align}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
            
            {(char.level > 1) && (
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-500">
                    <span className="material-symbols-outlined text-primary text-xl">Auto_Fix_High</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                        Level {char.level}: This will adjust your Proficiency Bonus and HP base stats in later steps.
                    </p>
                </div>
            )}
        </div>
    );
}

