"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Download, Upload, AlertTriangle, CheckCircle2, Server, Cloud } from 'lucide-react';

export default function DataMigration() {
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'syncing'>('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const syncToServer = async () => {
        setStatus('syncing');
        setMessage('Projecting data to Master Database...');

        try {
            const characters = JSON.parse(localStorage.getItem('mythic_saved_characters') || '[]');
            const campaigns = JSON.parse(localStorage.getItem('mythic_campaigns') || '[]');

            // Sync Characters
            for (const char of characters) {
                await fetch('/api/characters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(char)
                });
            }

            // Sync Campaigns
            for (const camp of campaigns) {
                await fetch('/api/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(camp)
                });
            }

            setStatus('success');
            setMessage('Synced to Network Database.');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Network Sync failed.');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const exportData = () => {
        try {
            const data: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('mythic_')) {
                    data[key] = JSON.parse(localStorage.getItem(key) || 'null');
                }
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mythic-archive-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus('success');
            setMessage('Archive synthesized successfully.');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            setStatus('error');
            setMessage('Failed to synthesize archive.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                if (typeof data !== 'object' || data === null) {
                    throw new Error('Invalid archive format');
                }

                // Verify this is a MythicTable archive
                const keys = Object.keys(data);
                if (!keys.some(k => k.startsWith('mythic_'))) {
                    throw new Error('No Mythic credentials found in archive');
                }

                Object.entries(data).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });

                setStatus('success');
                setMessage('Archive integrated. Re-initialising...');

                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error(error);
                setStatus('error');
                setMessage('Invalid archive structure.');
                setTimeout(() => setStatus('idle'), 3000);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="obsidian-panel rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />

            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Database className="size-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight">Data Hub</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-nowrap">Migrate & Secure Your Archive</p>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={syncToServer}
                        disabled={status === 'syncing'}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Server className="size-3" />
                        Push to Master
                    </button>
                    <button
                        onClick={exportData}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    >
                        <Download className="size-3" />
                        Save File
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all active:scale-95"
                    >
                        <Upload className="size-3" />
                        Load File
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={importData}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        <span className="text-emerald-500 font-black not-italic">Master Sync</span>: Project your local heroes to the centralized database file on your Mac. This makes them instantly available on your iPad and other network devices.
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center min-h-16">
                    <AnimatePresence mode="wait">
                        {status === 'idle' ? (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle2 className="size-3 text-slate-700" />
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-nowrap">System Ready</span>
                            </motion.div>
                        ) : status === 'syncing' ? (
                            <motion.div
                                key="syncing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-primary"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Cloud className="size-3" />
                                </motion.div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-nowrap">{message}</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="status"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex items-center gap-2 ${status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}
                            >
                                {status === 'success' ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                                <span className="text-[9px] font-black uppercase tracking-widest text-nowrap">{message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
