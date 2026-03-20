"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';

interface Beast {
    name: string;
    hp: number;
    ac: number;
    visualUrl: string;
}

interface WildshapeModalProps {
    isOpen: boolean;
    onClose: () => void;
    beasts: Beast[];
    onSelectBeast: (beastName: string) => void;
}

export function WildshapeModal({ 
    isOpen, 
    onClose, 
    beasts, 
    onSelectBeast 
}: WildshapeModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
                    
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-500">pets</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight">Wildshape</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select your form</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {beasts.map((beast, index) => (
                            <button
                                key={`${beast.name}-${index}`}
                                onClick={() => onSelectBeast(beast.name)}
                                className="w-full group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative">
                                        <ImageWithPlaceholder
                                            src={beast.visualUrl}
                                            alt={beast.name}
                                            containerClassName="w-full h-full"
                                            fallbackIcon="pets"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-200 uppercase group-hover:text-emerald-400 transition-colors">{beast.name}</h4>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[8px] font-black text-slate-500 uppercase">HP: {beast.hp}</span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase">AC: {beast.ac}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-500 transition-colors">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
