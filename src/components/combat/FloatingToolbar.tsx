"use client";

import React, { useRef, useState, useCallback } from 'react';
import {
    Upload, Link, Check, ImageOff, Layers, Grid3X3, Magnet,
    ShieldCheck, GripHorizontal, Eye, EyeOff, ChevronRight,
    Sun, Palette, Weight, Minus, Plus, X
} from 'lucide-react';

interface FloatingToolbarProps {
    battlemapBg: string | null;
    setBattlemapBg: (v: string | null) => void;
    bgOpacity: number;
    setBgOpacity: (v: number) => void;
    gridVisible: boolean;
    setGridVisible: (fn: (v: boolean) => boolean) => void;
    gridOpacity: number;
    setGridOpacity: (v: number) => void;
    gridThickness: number;
    setGridThickness: (v: number) => void;
    gridColor: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setGridColor: (v: any) => void;
    gridScale: number;
    setGridScale: (v: number) => void;
    snapToGrid: boolean;
    setSnapToGrid: (fn: (v: boolean) => boolean) => void;
    sidebarsVisible: boolean;
    setSidebarsVisible: (v: boolean) => void;
    onEndTurn: () => void;
    showJournal: boolean;
    setShowJournal: (v: boolean) => void;
}

type ActiveLayer = 'map' | 'grid' | null;

// ─── Reusable layer row ───────────────────────────────────────────────────────
function LayerRow({
    icon, label, active, onToggle, children,
}: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onToggle: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2.5">
                {/* visibility dot */}
                <button
                    onClick={onToggle}
                    className={`size-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        active ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title={active ? 'Hide layer' : 'Show layer'}
                >
                    {active
                        ? <Eye className="w-2.5 h-2.5 text-black" />
                        : <EyeOff className="w-2.5 h-2.5 text-slate-500" />
                    }
                </button>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={`transition-colors ${active ? 'text-slate-400' : 'text-slate-600'}`}>{icon}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                        active ? 'text-slate-300' : 'text-slate-600'
                    }`}>{label}</span>
                </div>
            </div>
            {active && children && (
                <div className="ml-6 space-y-2.5">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Slider control ──────────────────────────────────────────────────────────
function SliderRow({ label, value, min, max, step, onChange }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[8px] text-slate-600 uppercase tracking-widest w-12 shrink-0">{label}</span>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-amber-500 appearance-none cursor-pointer rounded-full"
            />
            <span className="text-[8px] text-slate-500 w-7 text-right tabular-nums">
                {Math.round(value * (step < 1 ? 100 : 1))}{step < 1 ? '%' : ''}
            </span>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function FloatingToolbar({
    battlemapBg, setBattlemapBg, bgOpacity, setBgOpacity,
    gridVisible, setGridVisible, gridOpacity, setGridOpacity,
    gridThickness, setGridThickness, gridColor, setGridColor,
    gridScale, setGridScale, snapToGrid, setSnapToGrid,
    sidebarsVisible, setSidebarsVisible, onEndTurn,
    showJournal, setShowJournal,
}: FloatingToolbarProps) {
    const [activeLayer, setActiveLayer] = useState<ActiveLayer>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    // Drag state
    const containerRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

    const onGripDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        dragRef.current = {
            startX: e.clientX, startY: e.clientY,
            origX: pos?.x ?? (rect.left + rect.width / 2),
            origY: pos?.y ?? rect.top,
        };
        (e.target as Element).setPointerCapture(e.pointerId);
    }, [pos]);

    const onGripMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current) return;
        setPos({
            x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
            y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
        });
    }, []);

    const onGripUp = useCallback(() => { dragRef.current = null; }, []);

    const toggleLayer = (layer: ActiveLayer) =>
        setActiveLayer(prev => prev === layer ? null : layer);

    const containerStyle: React.CSSProperties = pos
        ? { position: 'fixed', left: pos.x, top: pos.y, transform: 'translateX(-50%)', zIndex: 150 }
        : { position: 'absolute', top: 34, left: '50%', transform: 'translateX(-50%)', zIndex: 150 };

    const hasBg = !!battlemapBg;

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            className="pointer-events-auto"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex flex-col items-center gap-1.5">

                {/* ── Layers panel ── slides down from toolbar */}
                {activeLayer && (
                    <div className="w-64 bg-[#0d0d12] border border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] overflow-hidden order-first mb-1">
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <Layers className="w-3 h-3 text-amber-500/70" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Map Layers</span>
                            </div>
                            <button
                                onClick={() => setActiveLayer(null)}
                                className="text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="px-4 py-3 space-y-4">

                            {/* ── MAP LAYER ── */}
                            <LayerRow
                                icon={<Sun className="w-3 h-3" />}
                                label="Map"
                                active={hasBg}
                                onToggle={() => hasBg ? setBattlemapBg(null) : setShowUrlInput(true)}
                            >
                                {/* Upload / URL */}
                                <div className="flex items-center gap-1.5">
                                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest" title="Upload map image">
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                                const r = new FileReader();
                                                r.onload = re => setBattlemapBg(re.target?.result as string);
                                                r.readAsDataURL(f);
                                            }
                                        }} />
                                        <Upload className="w-3 h-3" /> Upload
                                    </label>
                                    <button
                                        onClick={() => setShowUrlInput(v => !v)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${showUrlInput ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/8 text-slate-400 hover:text-white'}`}
                                        title="Paste URL"
                                    >
                                        <Link className="w-3 h-3" /> URL
                                    </button>
                                </div>

                                {showUrlInput && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/40 rounded-xl border border-white/8">
                                        <input
                                            autoFocus
                                            value={urlInput}
                                            onChange={e => setUrlInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') { setBattlemapBg(urlInput); setShowUrlInput(false); setUrlInput(''); }
                                                if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput(''); }
                                            }}
                                            placeholder="https://…"
                                            className="flex-1 bg-transparent text-[10px] text-white placeholder:text-slate-700 outline-none min-w-0"
                                        />
                                        <button onClick={() => { setBattlemapBg(urlInput); setShowUrlInput(false); setUrlInput(''); }} className="text-amber-500 hover:text-amber-400 shrink-0">
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <SliderRow label="Opacity" value={bgOpacity} min={0} max={1} step={0.05} onChange={setBgOpacity} />

                                {hasBg && (
                                    <button
                                        onClick={() => setBattlemapBg(null)}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-500/60 hover:text-red-400 hover:bg-red-500/15 text-[8px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <ImageOff className="w-3 h-3" /> Clear Map
                                    </button>
                                )}
                            </LayerRow>

                            <div className="h-px bg-white/5" />

                            {/* ── GRID LAYER ── */}
                            <LayerRow
                                icon={<Grid3X3 className="w-3 h-3" />}
                                label="Grid"
                                active={gridVisible}
                                onToggle={() => setGridVisible(v => !v)}
                            >
                                <SliderRow label="Opacity" value={gridOpacity} min={0} max={1} step={0.05} onChange={setGridOpacity} />

                                {/* Color picker */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] text-slate-600 uppercase tracking-widest w-12 shrink-0">Color</span>
                                    <div className="flex gap-1.5 flex-1">
                                        {(['#ffffff', '#000000', '#f59e0b', '#60a5fa'] as const).map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setGridColor(c)}
                                                className={`flex-1 h-5 rounded-md border-2 transition-all ${
                                                    gridColor === c ? 'border-amber-400 scale-110' : 'border-transparent hover:border-white/20'
                                                }`}
                                                style={{ background: c }}
                                                title={c}
                                            />
                                        ))}
                                        <div className="relative flex-1">
                                            <input
                                                type="color"
                                                value={typeof gridColor === 'string' && gridColor.startsWith('#') ? gridColor : '#ffffff'}
                                                onChange={e => setGridColor(e.target.value)}
                                                className="absolute inset-0 opacity-0 w-full cursor-pointer"
                                                title="Custom color"
                                            />
                                            <div className="h-5 rounded-md border border-white/10 bg-gradient-to-r from-red-400 via-green-400 to-blue-400 flex items-center justify-center">
                                                <Palette className="w-2.5 h-2.5 text-white drop-shadow" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Thickness */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] text-slate-600 uppercase tracking-widest w-12 shrink-0">Weight</span>
                                    <div className="flex items-center gap-2 flex-1">
                                        <button
                                            onClick={() => setGridThickness(Math.max(0.5, (gridThickness || 1) - 0.5))}
                                            className="size-5 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                                        >
                                            <Minus className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="flex-1 text-center text-[10px] text-white font-black tabular-nums">{gridThickness || 1}px</span>
                                        <button
                                            onClick={() => setGridThickness((gridThickness || 1) + 0.5)}
                                            className="size-5 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                                        >
                                            <Plus className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Snap */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Magnet className="w-3 h-3 text-slate-600" />
                                        <span className="text-[8px] text-slate-600 uppercase tracking-widest">Snap to grid</span>
                                    </div>
                                    <button
                                        onClick={() => setSnapToGrid(v => !v)}
                                        className={`relative w-8 h-4 rounded-full border transition-all ${
                                            snapToGrid ? 'bg-amber-500/30 border-amber-500/50' : 'bg-white/5 border-white/10'
                                        }`}
                                        title={snapToGrid ? 'Snap enabled' : 'Snap disabled'}
                                    >
                                        <span className={`absolute top-0.5 size-3 rounded-full transition-all ${
                                            snapToGrid ? 'left-[18px] bg-amber-400' : 'left-0.5 bg-slate-600'
                                        }`} />
                                    </button>
                                </div>
                            </LayerRow>

                        </div>
                    </div>
                )}

                {/* ── Main compact toolbar ── */}
                <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0d0d12] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

                    {/* Drag handle */}
                    <div
                        className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-400 transition-colors touch-none px-1 shrink-0"
                        onPointerDown={onGripDown}
                        onPointerMove={onGripMove}
                        onPointerUp={onGripUp}
                        onPointerCancel={onGripUp}
                        title="Drag to reposition"
                    >
                        <GripHorizontal className="w-3.5 h-3.5" />
                    </div>

                    <div className="h-4 w-px bg-white/8" />

                    {/* Layers toggle */}
                    <button
                        onClick={() => toggleLayer(activeLayer ? null : 'map')}
                        className={`flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                            activeLayer ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/8 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Map Layers"
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Layers</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${activeLayer ? 'rotate-90' : ''}`} />
                    </button>

                    <div className="h-4 w-px bg-white/8" />

                    {/* Grid quick-toggle */}
                    <button
                        onClick={() => setGridVisible(v => !v)}
                        className={`size-7 rounded-xl flex items-center justify-center transition-all border ${
                            gridVisible ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/8 text-slate-600 hover:text-slate-400'
                        }`}
                        title={gridVisible ? 'Hide grid' : 'Show grid'}
                    >
                        <Grid3X3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Snap quick-toggle */}
                    <button
                        onClick={() => setSnapToGrid(v => !v)}
                        className={`size-7 rounded-xl flex items-center justify-center transition-all border ${
                            snapToGrid ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/8 text-slate-600 hover:text-slate-400'
                        }`}
                        title={snapToGrid ? 'Snap on' : 'Snap off'}
                    >
                        <Magnet className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-4 w-px bg-white/8" />

                    {/* End Turn */}
                    <button
                        onClick={onEndTurn}
                        className="h-7 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        title="End Turn"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-black" />
                        <span className="text-[9px] font-black uppercase tracking-wider">End Turn</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
