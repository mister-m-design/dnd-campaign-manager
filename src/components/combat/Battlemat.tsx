import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Swords, Move } from 'lucide-react';
import { ImageWithPlaceholder } from '@/components/ui/ImageWithPlaceholder';
import { CombatantState } from '../../types';
import { getCondColor } from '../../utils/combatUtils';

// ─── Constants ────────────────────────────────────────────────────────────────
const TOKEN_SIZE = 80;
const TOKEN_HALF = 40;
const GRID_PX    = 50;   // pixels per 5-ft square at native scale

// ─── Types ────────────────────────────────────────────────────────────────────
interface BattlematProps {
    combatants: CombatantState[];
    activeId: string | null;
    selectedId: string | null;
    targetId: string | null;
    hoveredId?: string | null;
    floatingTexts?: { id: string; text: string; x: number; y: number }[];
    onSelect: (id: string | null) => void;
    onHover?: (id: string | null) => void;
    onSetTarget: (id: string | null) => void;
    onAction?: (attacker: CombatantState, action: any) => void;
    onPositionUpdate: (id: string, pos: { x: number; y: number }, cost?: number) => void;
    addLog?: (message: string, type?: any) => void;
    bg?: string | null;
    bgOpacity?: number;
    isDMMode?: boolean;
    snapToGrid?: boolean;
    gridScale?: number;
    aoePreview?: any;
    onAoEConfirm?: (center: { x: number; y: number }) => void;
    onAoECancel?: () => void;
    combatPhase?: string;
    movePreviewDest?: { x: number; y: number } | null;
    onMovePreviewUpdate?: (pos: { x: number; y: number } | null) => void;
    onMoveConfirm?: () => void;
    onMoveCancel?: () => void;
    obstacles?: Set<string>;
    difficultTerrain?: Set<string>;
}

interface CtxMenu { combatantId: string; screenX: number; screenY: number; }
interface DragRef  { id: string; wx0: number; wy0: number; sx0: number; sy0: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAutoPos(idx: number, total: number, w: number, h: number): { x: number; y: number } {
    const cols    = Math.max(1, Math.ceil(Math.sqrt(total)));
    const spacing = TOKEN_SIZE * 2.0;
    const rows    = Math.ceil(total / cols);
    const col     = idx % cols;
    const row     = Math.floor(idx / cols);
    const gridW   = cols * spacing;
    const gridH   = rows * spacing;
    const startX  = w / 2 - gridW / 2;
    const startY  = h / 2 - gridH / 2;
    return {
        x: startX + col * spacing + TOKEN_HALF / 2,
        y: startY + row * spacing + TOKEN_HALF / 2,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Battlemat({
    combatants, activeId, selectedId, targetId,
    floatingTexts = [],
    onSelect, onHover, onSetTarget, onPositionUpdate, addLog,
    bg, bgOpacity = 0.9, isDMMode, snapToGrid, gridScale = 5,
}: BattlematProps) {

    const containerRef = useRef<HTMLDivElement>(null);
    const [cw, setCw] = useState(800);
    const [ch, setCh] = useState(600);

    // Measure container so autoPos can centre tokens
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            if (width > 10 && height > 10) { setCw(width); setCh(height); }
        };
        const t = setTimeout(update, 30);
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => { clearTimeout(t); ro.disconnect(); };
    }, []);

    // Resolve a combatant's position.
    // Saved positions from the old 3000×3000 world will be out-of-bounds
    // for the current container, so we treat any position outside the
    // visible area as invalid and fall back to auto-distribution.
    const isOnScreen = useCallback((pos: { x: number; y: number } | undefined | null): boolean => {
        if (!pos) return false;
        const margin = TOKEN_SIZE * 2; // allow a token's width of overhang
        return pos.x > -margin && pos.x < cw + margin && pos.y > -margin && pos.y < ch + margin;
    }, [cw, ch]);

    const resolvePos = useCallback((c: CombatantState) => {
        if (isOnScreen(c.position)) return c.position!;
        const idx = combatants.findIndex(x => x.instanceId === c.instanceId);
        return getAutoPos(idx, combatants.length, cw, ch);
    }, [combatants, cw, ch, isOnScreen]);

    const activeCombatant = combatants.find(c => c.instanceId === activeId);

    // ── Token drag ───────────────────────────────────────────────────────────
    const dragRef   = useRef<DragRef | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragPos,    setDragPos]    = useState<{ x: number; y: number } | null>(null);

    // ── Context menu ─────────────────────────────────────────────────────────
    const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const PX_PER_FT = GRID_PX / gridScale;

    const snap = useCallback((x: number, y: number) => {
        if (!snapToGrid) return { x: Math.max(0, x), y: Math.max(0, y) };
        return {
            x: Math.max(0, Math.round(x / GRID_PX) * GRID_PX),
            y: Math.max(0, Math.round(y / GRID_PX) * GRID_PX),
        };
    }, [snapToGrid]);

    const tokenCenter = (pos: { x: number; y: number }) =>
        ({ cx: pos.x + TOKEN_HALF, cy: pos.y + TOKEN_HALF });

    const distFt = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const { cx: ax, cy: ay } = tokenCenter(a);
        const { cx: bx, cy: by } = tokenCenter(b);
        return Math.round(Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2) / PX_PER_FT);
    };

    // Pointer drag — no zoom compensation (container-space = screen-space)
    const onTokenDown = useCallback((e: React.PointerEvent<HTMLDivElement>, c: CombatantState, pos: { x: number; y: number }) => {
        e.stopPropagation();
        e.preventDefault();
        dragRef.current = { id: c.instanceId, wx0: pos.x, wy0: pos.y, sx0: e.clientX, sy0: e.clientY };
        setDraggingId(c.instanceId);
        setDragPos(pos);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const onTokenMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.sx0;
        const dy = e.clientY - dragRef.current.sy0;
        setDragPos({ x: dragRef.current.wx0 + dx, y: dragRef.current.wy0 + dy });
    }, []);

    const onTokenUp = useCallback((e: React.PointerEvent<HTMLDivElement>, c: CombatantState) => {
        if (!dragRef.current || dragRef.current.id !== c.instanceId) return;
        if (dragPos) onPositionUpdate(c.instanceId, snap(dragPos.x, dragPos.y));
        dragRef.current = null;
        setDraggingId(null);
        setDragPos(null);
    }, [dragPos, snap, onPositionUpdate]);

    // ── Move to melee ────────────────────────────────────────────────────────
    const moveToMelee = useCallback((targetC: CombatantState) => {
        if (!activeCombatant) return;
        const ap = resolvePos(activeCombatant);
        const tp = resolvePos(targetC);
        const { cx: tx, cy: ty } = tokenCenter(tp);
        const { cx: ax, cy: ay } = tokenCenter(ap);
        const dx = ax - tx, dy = ay - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const reach = GRID_PX + TOKEN_SIZE;
        if (dist <= reach) { addLog?.(`${activeCombatant.name} is already in melee range.`, 'system'); setCtxMenu(null); return; }
        const ratio  = (dist - reach) / dist;
        const newPos = snap(ax - dx * ratio - TOKEN_HALF, ay - dy * ratio - TOKEN_HALF);
        const cost   = distFt(ap, newPos);
        onPositionUpdate(activeCombatant.instanceId, newPos, cost);
        addLog?.(`${activeCombatant.name} moves to melee range of ${targetC.name} (${cost}ft).`, 'combat');
        setCtxMenu(null);
    }, [activeCombatant, resolvePos, snap, onPositionUpdate, addLog]);

    // ── SVG overlays ─────────────────────────────────────────────────────────
    const renderReachCircle = () => {
        if (!activeCombatant) return null;
        // ALWAYS resolve position (fallback to autoPos if not yet placed)
        const pos = resolvePos(activeCombatant);
        const { cx, cy } = tokenCenter(pos);
        const moveRemaining = activeCombatant.resources?.movementRemaining ?? activeCombatant.speed ?? 30;
        const movePx  = moveRemaining * PX_PER_FT;
        const reachPx = 5 * PX_PER_FT + TOKEN_HALF;
        return (
            <g>
                {/* Movement range circle */}
                <circle cx={cx} cy={cy} r={movePx}
                    fill="rgba(245,158,11,0.06)"
                    stroke="rgba(245,158,11,0.35)"
                    strokeWidth="1.5" strokeDasharray="6 3" />
                {/* 5ft melee reach */}
                <circle cx={cx} cy={cy} r={reachPx}
                    fill="none"
                    stroke="rgba(245,158,11,0.6)"
                    strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Movement label */}
                <rect x={cx - 22} y={cy - movePx - 20} width="44" height="17" rx="8" fill="rgba(0,0,0,0.8)" />
                <text x={cx} y={cy - movePx - 8} textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="bold">
                    {moveRemaining}ft
                </text>
            </g>
        );
    };

    const renderRangeLine = () => {
        if (!activeCombatant || !targetId) return null;
        const targetC = combatants.find(c => c.instanceId === targetId);
        if (!targetC) return null;
        const ap = resolvePos(activeCombatant);
        const tp = resolvePos(targetC);
        const { cx: sx, cy: sy } = tokenCenter(ap);
        const { cx: ex, cy: ey } = tokenCenter(tp);
        const dist = distFt(ap, tp);
        const mx = (sx + ex) / 2, my = (sy + ey) / 2;
        return (
            <g>
                <line x1={sx} y1={sy} x2={ex} y2={ey}
                    stroke="rgba(239,68,68,0.7)" strokeWidth="2" strokeDasharray="8 4" />
                <rect x={mx - 20} y={my - 11} width="40" height="22" rx="11" fill="rgba(0,0,0,0.85)" />
                <text x={mx} y={my + 5} textAnchor="middle" fontSize="11" fill="#f87171" fontWeight="bold">{dist}ft</text>
                <circle cx={sx} cy={sy} r="5" fill="rgba(251,191,36,0.9)" />
                <circle cx={ex} cy={ey} r="5" fill="rgba(239,68,68,0.9)" />
            </g>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-[#060608] select-none"
            onClick={() => setCtxMenu(null)}
        >
            {/* Background image — contain so full image is visible, no crop */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundColor: '#090912',
            }} />
            {bg && (
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `url(${bg})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: bgOpacity,
                }} />
            )}

            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
            }} />

            {/* SVG overlays — reach circle, range line, target ring (hidden in DM/setup mode) */}
            <svg
                className="absolute inset-0 pointer-events-none"
                width="100%" height="100%"
                style={{ zIndex: 5 }}
            >
                {!isDMMode && renderReachCircle()}
                {!isDMMode && renderRangeLine()}

                {/* Target pulsing ring */}
                {targetId && (() => {
                    const tc = combatants.find(c => c.instanceId === targetId);
                    if (!tc) return null;
                    const { cx, cy } = tokenCenter(resolvePos(tc));
                    return (
                        <g>
                            <circle cx={cx} cy={cy} r={TOKEN_HALF + 14}
                                fill="none" stroke="rgba(244,63,94,0.45)"
                                strokeWidth="2" strokeDasharray="6 4" />
                            <circle cx={cx} cy={cy} r={TOKEN_HALF + 7}
                                fill="none" stroke="rgba(244,63,94,0.2)"
                                strokeWidth="3" />
                        </g>
                    );
                })()}
            </svg>

            {/* ── Tokens ───────────────────────────────────────────────────── */}
            {combatants.map((c, idx) => {
                const isActive   = c.instanceId === activeId;
                const isSelected = c.instanceId === selectedId;
                const isTarget   = c.instanceId === targetId;
                const isDead     = c.currentHP <= 0;
                const isDragging = draggingId === c.instanceId;
                const hpPct      = c.maxHP > 0 ? (c.currentHP / c.maxHP) * 100 : 0;
                const basePos    = isOnScreen(c.position) ? c.position! : getAutoPos(idx, combatants.length, cw, ch);
                const pos        = (isDragging && dragPos) ? dragPos : basePos;
                const moveMax    = c.resources?.movementMax ?? c.speed ?? 30;
                const moveLeft   = c.resources?.movementRemaining ?? moveMax;
                const moveSpent  = moveMax - moveLeft;
                const movePct    = moveMax > 0 ? (moveLeft / moveMax) * 100 : 100;

                return (
                    <div
                        key={c.instanceId}
                        data-token="1"
                        className="absolute group"
                        style={{
                            left: pos.x,
                            top:  pos.y,
                            width:  TOKEN_SIZE,
                            height: TOKEN_SIZE,
                            zIndex: isDragging ? 100 : isActive ? 20 : 10,
                            cursor: isDragging ? 'grabbing' : 'grab',
                            touchAction: 'none',
                            transform: `scale(${isSelected || isActive ? 1.08 : 1})`,
                            transformOrigin: 'center',
                            opacity: isDead ? 0.45 : 1,
                            transition: isDragging ? 'none' : 'transform 0.12s ease, opacity 0.2s',
                            willChange: isDragging ? 'left,top' : 'auto',
                        }}
                        onPointerDown={e => onTokenDown(e, c, basePos)}
                        onPointerMove={onTokenMove}
                        onPointerUp={e => onTokenUp(e, c)}
                        onClick={e => {
                            e.stopPropagation();
                            // In DM/setup mode: just select, no targeting or context menu
                            if (isDMMode) {
                                onSelect(c.instanceId);
                                return;
                            }
                            if (activeCombatant && c.instanceId !== activeId) {
                                setCtxMenu({ combatantId: c.instanceId, screenX: e.clientX, screenY: e.clientY });
                                onSetTarget(c.instanceId === targetId ? null : c.instanceId);
                            }
                            onSelect(c.instanceId);
                        }}
                        onMouseEnter={() => onHover?.(c.instanceId)}
                        onMouseLeave={() => onHover?.(null)}
                    >
                        {/* Aura glow */}
                        <div className={`absolute -inset-4 rounded-full blur-2xl opacity-30 pointer-events-none transition-colors duration-300 ${
                            isActive ? 'bg-amber-400' :
                            isTarget ? 'bg-rose-500' :
                            isDMMode ? 'bg-purple-500' : 'bg-transparent'
                        }`} />

                        {/* Token body */}
                        <div className={`absolute inset-0 rounded-full overflow-hidden bg-slate-900 shadow-2xl border-[3px] transition-all duration-150 ${
                            isDMMode   ? 'border-purple-500 ring-2 ring-purple-400/30' :
                            isActive   ? 'border-amber-400 ring-4 ring-amber-400/25 shadow-[0_0_30px_rgba(251,191,36,0.25)]' :
                            isTarget   ? 'border-rose-500 ring-2 ring-rose-500/25' :
                            isSelected ? 'border-sky-400 ring-2 ring-sky-400/20' :
                            'border-white/20 group-hover:border-white/50'
                        }`}>
                            <ImageWithPlaceholder
                                src={c.portrait} alt={c.name} name={c.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] pointer-events-none" />
                            {hpPct < 25 && !isDead && <div className="absolute inset-0 bg-rose-500/20 animate-pulse pointer-events-none" />}
                            {isDead && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Dead</span>
                                </div>
                            )}
                        </div>

                        {/* HP arc */}
                        <svg className="absolute pointer-events-none"
                            style={{ inset: -3, width: TOKEN_SIZE + 6, height: TOKEN_SIZE + 6, transform: 'rotate(-90deg)' }}
                            viewBox="0 0 86 86"
                        >
                            <circle cx="43" cy="43" r="39"
                                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                            <circle cx="43" cy="43" r="39"
                                fill="none"
                                stroke={hpPct > 50 ? '#10b981' : hpPct > 25 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="4"
                                strokeDasharray={`${245.04 * hpPct / 100} 245.04`}
                                strokeLinecap="round"
                                style={{ transition: isDragging ? 'none' : 'stroke-dasharray 0.7s ease' }}
                            />
                        </svg>

                        {/* Movement arc (outer ring) */}
                        {moveMax > 0 && (
                            <svg className="absolute pointer-events-none"
                                style={{ inset: -9, width: TOKEN_SIZE + 18, height: TOKEN_SIZE + 18, transform: 'rotate(-90deg)' }}
                                viewBox="0 0 98 98"
                            >
                                <circle cx="49" cy="49" r="44"
                                    fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                                <circle cx="49" cy="49" r="44"
                                    fill="none"
                                    stroke="rgba(125,211,252,0.55)"
                                    strokeWidth="3"
                                    strokeDasharray={`${276.46 * movePct / 100} 276.46`}
                                    strokeLinecap="round"
                                    style={{ transition: isDragging ? 'none' : 'stroke-dasharray 0.5s ease' }}
                                />
                            </svg>
                        )}

                        {/* Badges */}
                        <div className="absolute -top-1 -right-1 flex flex-col gap-1 pointer-events-none" style={{ zIndex: 25 }}>
                            {isActive && (
                                <div className="size-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg animate-bounce">
                                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>bolt</span>
                                </div>
                            )}
                            {isTarget && !isActive && (
                                <div className="size-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg">
                                    <Target className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </div>

                        {/* Name + HP + movement below */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none whitespace-nowrap"
                            style={{ top: TOKEN_SIZE + 5, zIndex: 20 }}
                        >
                            <span className="text-[9px] font-black text-white uppercase tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,1)] bg-black/70 px-1.5 py-0.5 rounded">
                                {c.name.length > 11 ? c.name.slice(0, 11) + '…' : c.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[7px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,1)]"
                                    style={{ color: hpPct > 50 ? '#10b981' : hpPct > 25 ? '#f59e0b' : '#ef4444' }}>
                                    {c.currentHP}/{c.maxHP}
                                </span>
                                {moveSpent > 0 && (
                                    <span className="text-[7px] font-bold text-sky-400 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                                        {moveLeft}ft
                                    </span>
                                )}
                            </div>
                            {(c.conditions?.length ?? 0) > 0 && (
                                <div className="flex gap-0.5">
                                    {c.conditions?.slice(0, 3).map((cond: string) => {
                                        const cfg = getCondColor(cond);
                                        return (
                                            <div key={cond} className="size-3 rounded-full flex items-center justify-center border border-white/20"
                                                style={{ backgroundColor: cfg.color }}>
                                                <span className="material-symbols-outlined text-black font-black" style={{ fontSize: 6 }}>{cfg.icon}</span>
                                            </div>
                                        );
                                    })}
                                    {(c.conditions?.length ?? 0) > 3 && (
                                        <span className="text-[6px] text-slate-500">+{(c.conditions?.length ?? 0) - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Floating texts */}
                        {floatingTexts.filter(ft => ft.id === c.instanceId).map(ft => (
                            <motion.div
                                key={ft.id + ft.text}
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -40 }}
                                transition={{ duration: 1.2 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-black text-rose-400 pointer-events-none drop-shadow-lg"
                                style={{ zIndex: 30 }}
                            >
                                {ft.text}
                            </motion.div>
                        ))}
                    </div>
                );
            })}

            {/* ── CONTEXT MENU ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {ctxMenu && (() => {
                    const target = combatants.find(c => c.instanceId === ctxMenu.combatantId);
                    if (!target) return null;
                    const tp   = resolvePos(target);
                    const ap   = activeCombatant ? resolvePos(activeCombatant) : null;
                    const dist = ap ? distFt(ap, tp) : null;
                    return (
                        <motion.div
                            key="ctx"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.1 }}
                            className="fixed z-[9999] bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl min-w-[160px] overflow-hidden"
                            style={{ left: ctxMenu.screenX + 8, top: ctxMenu.screenY - 8 }}
                            onClick={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()}
                        >
                            <div className="px-3 py-2 border-b border-white/5 bg-white/[0.03]">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{target.name}</p>
                                {dist !== null && <p className="text-[7px] text-slate-600 mt-0.5">{dist}ft away</p>}
                            </div>
                            <div className="p-1">
                                <button
                                    onClick={() => { onSetTarget(ctxMenu.combatantId); setCtxMenu(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-all text-left"
                                >
                                    <Target className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">Set as Target</span>
                                </button>
                                {activeCombatant?.instanceId !== ctxMenu.combatantId && (
                                    <button
                                        onClick={() => moveToMelee(target)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-500/10 transition-all text-left"
                                    >
                                        <Move className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 block">Move to Melee</span>
                                            <span className="text-[7px] text-slate-600">Within 5ft</span>
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={() => { onSelect(ctxMenu.combatantId); setCtxMenu(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sky-500/10 transition-all text-left"
                                >
                                    <Swords className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-300">Inspect</span>
                                </button>
                            </div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
