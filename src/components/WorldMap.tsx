'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, MapPin, Plus, Trash2, Pencil, X, Check, Upload,
  Grid3X3, Eye, EyeOff, Layers, Link as LinkIcon,
  Flag, Home, Skull, Star, Swords, ZoomIn, ZoomOut, Maximize2, Globe,
} from 'lucide-react';
import { usePersistentState } from '@/hooks/usePersistentState';
import { generateSafeId } from '@/lib/utils';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type MarkerType = 'city' | 'dungeon' | 'poi' | 'battle' | 'home' | 'region' | 'npc' | 'secret';

export interface WorldMarker {
  id: string;
  label: string;
  type: MarkerType;
  x: number;    // 0–100 percent of map width
  y: number;    // 0–100 percent of map height
  notes?: string;
  linkedEncounterId?: string;
  visited: boolean;
  pinned: boolean;
}

interface MapTransform {
  scale: number;
  x: number;
  y: number;
}

interface WorldMapState {
  imageUrl: string | null;
  isSvg: boolean;
  markers: WorldMarker[];
  gridOpacity: number;
  showGrid: boolean;
  gridSize: number;
  savedTransform: MapTransform;  // persisted zoom/pan
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DEFAULT_TRANSFORM: MapTransform = { scale: 1, x: 0, y: 0 };

const DEFAULT_MAP_STATE: WorldMapState = {
  imageUrl: null,
  isSvg: false,
  markers: [],
  gridOpacity: 20,
  showGrid: false,
  gridSize: 20,
  savedTransform: DEFAULT_TRANSFORM,
};

const MIN_SCALE = 0.05;
const MAX_SCALE = 40;
const ZOOM_FACTOR = 1.15;

const MARKER_ICONS: Record<MarkerType, { icon: React.ReactNode; color: string; label: string }> = {
  city:    { icon: <Home size={12} />,     color: '#F59E0B', label: 'City / Town' },
  dungeon: { icon: <Skull size={12} />,    color: '#EF4444', label: 'Dungeon' },
  poi:     { icon: <MapPin size={12} />,   color: '#8B5CF6', label: 'Point of Interest' },
  battle:  { icon: <Swords size={12} />,  color: '#F97316', label: 'Battle Site' },
  home:    { icon: <Flag size={12} />,     color: '#10B981', label: 'Base / Camp' },
  region:  { icon: <Layers size={12} />,   color: '#06B6D4', label: 'Region' },
  npc:     { icon: <Star size={12} />,     color: '#EC4899', label: 'NPC Location' },
  secret:  { icon: <LinkIcon size={12} />, color: '#6B7280', label: 'Secret' },
};

// ─── MARKER ICON ──────────────────────────────────────────────────────────────

function MarkerIcon({ type, visited, pinned, size = 28 }: { type: MarkerType; visited?: boolean; pinned?: boolean; size?: number }) {
  const { icon, color } = MARKER_ICONS[type];
  return (
    <div
      className="rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 relative"
      style={{
        width: size,
        height: size,
        background: visited ? '#374151' : color,
        opacity: visited ? 0.6 : 1,
      }}
    >
      <div className="text-white" style={{ transform: 'scale(0.85)' }}>{icon}</div>
      {pinned && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-slate-900" />
      )}
    </div>
  );
}

// ─── MARKER FORM ──────────────────────────────────────────────────────────────

function MarkerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<WorldMarker> & { x: number; y: number };
  onSave: (m: Omit<WorldMarker, 'id'>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial.label ?? '');
  const [type, setType] = useState<MarkerType>(initial.type ?? 'poi');
  const [notes, setNotes] = useState(initial.notes ?? '');

  return (
    <div className="p-4 space-y-3">
      <input
        autoFocus
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Location name…"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
      />
      <div className="grid grid-cols-4 gap-1">
        {(Object.keys(MARKER_ICONS) as MarkerType[]).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all ${
              type === t ? 'bg-slate-700 ring-1 ring-amber-500/50' : 'hover:bg-slate-800'
            }`}
          >
            <MarkerIcon type={t} size={20} />
            <span className="text-[7px] text-slate-500 capitalize leading-tight text-center">{MARKER_ICONS[t].label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional)…"
        rows={2}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ label: label || 'Unnamed', type, notes, x: initial.x, y: initial.y, visited: false, pinned: false })}
          className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── WORLD MAP ────────────────────────────────────────────────────────────────

export default function WorldMap({ campaignId }: { campaignId?: string }) {
  const storageKey = campaignId ? `mythic_worldmap_${campaignId}` : 'mythic_worldmap_global';
  const [mapState, setMapState] = usePersistentState<WorldMapState>(storageKey, DEFAULT_MAP_STATE);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);
  const mapImgRef    = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgUrlInputRef = useRef<HTMLInputElement>(null);

  // ── Transform state (scale + pan) ─────────────────────────────────────────
  // Kept in a ref for high-frequency updates (no React re-render during pan),
  // mirrored to `tState` for React-driven layouts like marker positions.
  const transformRef = useRef<MapTransform>(mapState.savedTransform ?? DEFAULT_TRANSFORM);
  const [tState, setTState] = useState<MapTransform>(mapState.savedTransform ?? DEFAULT_TRANSFORM);

  // Natural pixel dimensions of the loaded map content
  const [mapSize, setMapSize] = useState({ w: 2000, h: 1500 });

  // Sync persisted transform on first load
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current && mapState.savedTransform) {
      transformRef.current = mapState.savedTransform;
      setTState(mapState.savedTransform);
      applyTransform(mapState.savedTransform);
      didInit.current = true;
    }
  }, [mapState.savedTransform]);

  // ── Interaction state ─────────────────────────────────────────────────────
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingMarker, setEditingMarker]     = useState<WorldMarker | null>(null);
  const [selectedMarker, setSelectedMarker]   = useState<WorldMarker | null>(null);
  const [showSidebar, setShowSidebar]         = useState(true);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput]       = useState(false);
  const [urlInputValue, setUrlInputValue]     = useState('');

  const isDragging  = useRef(false);
  const dragOrigin  = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });
  const didMoveRef  = useRef(false);   // to distinguish click from drag

  // Touch pinch state
  const lastPinchDist = useRef<number | null>(null);
  const pinchMid      = useRef({ x: 0, y: 0 });

  // Debounce timer for persisting transform
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Apply CSS transform directly (no React re-render) ─────────────────────
  const applyTransform = useCallback((t: MapTransform) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    }
    // Update CSS custom property for counter-scaling markers
    if (containerRef.current) {
      containerRef.current.style.setProperty('--map-scale', String(t.scale));
    }
  }, []);

  const commitTransform = useCallback((t: MapTransform) => {
    transformRef.current = t;
    applyTransform(t);
    setTState(t);
    // Debounce persistence
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      setMapState(prev => ({ ...prev, savedTransform: t }));
    }, 800);
  }, [applyTransform, setMapState]);

  // ── ZOOM toward a screen point ─────────────────────────────────────────────
  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const t  = transformRef.current;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor));
    const newX = cx - (cx - t.x) * (newScale / t.scale);
    const newY = cy - (cy - t.y) * (newScale / t.scale);
    commitTransform({ scale: newScale, x: newX, y: newY });
  }, [commitTransform]);

  // ── FIT to screen ──────────────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const scaleX  = width  / mapSize.w;
    const scaleY  = height / mapSize.h;
    const newScale = Math.min(scaleX, scaleY) * 0.92;
    const newX = (width  - mapSize.w * newScale) / 2;
    const newY = (height - mapSize.h * newScale) / 2;
    commitTransform({ scale: newScale, x: newX, y: newY });
  }, [mapSize, commitTransform]);

  // Auto-fit when a new map loads
  useEffect(() => {
    if (mapSize.w > 0) {
      // Only auto-fit if the saved transform is essentially default
      const t = transformRef.current;
      if (t.scale === 1 && t.x === 0 && t.y === 0) {
        fitToScreen();
      }
    }
  }, [mapSize.w]);

  // ── WHEEL → zoom ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    zoomAt(e.clientX, e.clientY, factor);
  }, [zoomAt]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── POINTER → pan ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isPlacingMarker) return;
    if (e.button !== 0 && e.button !== 1) return;
    isDragging.current = true;
    didMoveRef.current = false;
    dragOrigin.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: transformRef.current.x,
      panY: transformRef.current.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [isPlacingMarker]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragOrigin.current.mouseX;
    const dy = e.clientY - dragOrigin.current.mouseY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didMoveRef.current = true;
    const t = { ...transformRef.current, x: dragOrigin.current.panX + dx, y: dragOrigin.current.panY + dy };
    transformRef.current = t;
    applyTransform(t);
  }, [applyTransform]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Persist final pan position
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      setMapState(prev => ({ ...prev, savedTransform: transformRef.current }));
    }, 800);
    setTState({ ...transformRef.current });
  }, [setMapState]);

  // ── TOUCH → pinch zoom ────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      lastPinchDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchMid.current = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = dist / lastPinchDist.current;
      lastPinchDist.current = dist;
      pinchMid.current = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      zoomAt(pinchMid.current.x, pinchMid.current.y, factor);
    }
  }, [zoomAt]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
  }, []);

  // ── CLICK → place marker ──────────────────────────────────────────────────
  // Converts screen click to map percentage coordinates
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (didMoveRef.current) return; // was a pan, not a click
    if (!isPlacingMarker) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const t    = transformRef.current;
    // Screen → content pixels
    const mapX = (e.clientX - rect.left - t.x) / t.scale;
    const mapY = (e.clientY - rect.top  - t.y) / t.scale;
    // Content pixels → percentage
    const xPct = (mapX / mapSize.w) * 100;
    const yPct = (mapY / mapSize.h) * 100;
    if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
    setPendingPosition({ x: xPct, y: yPct });
  }, [isPlacingMarker, mapSize]);

  // ── MAP % → screen position (for popups rendered outside transform) ───────
  const mapPctToScreen = useCallback((xPct: number, yPct: number) => {
    const t = tState;
    return {
      x: t.x + (xPct / 100) * mapSize.w * t.scale,
      y: t.y + (yPct / 100) * mapSize.h * t.scale,
    };
  }, [tState, mapSize]);

  // ── STATE HELPERS ─────────────────────────────────────────────────────────
  const updateState = (updates: Partial<WorldMapState>) =>
    setMapState(prev => ({ ...prev, ...updates }));

  const addMarker = (m: Omit<WorldMarker, 'id'>) => {
    updateState({ markers: [...mapState.markers, { ...m, id: generateSafeId() }] });
    setPendingPosition(null);
    setIsPlacingMarker(false);
  };

  const updateMarker = (id: string, updates: Partial<WorldMarker>) => {
    updateState({ markers: mapState.markers.map(m => m.id === id ? { ...m, ...updates } : m) });
    setEditingMarker(null);
    setSelectedMarker(null);
  };

  const deleteMarker = (id: string) => {
    updateState({ markers: mapState.markers.filter(m => m.id !== id) });
    setSelectedMarker(null);
    setEditingMarker(null);
  };

  // ── UPLOAD ────────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      updateState({ imageUrl: url, isSvg, savedTransform: DEFAULT_TRANSFORM });
      transformRef.current = DEFAULT_TRANSFORM;
      applyTransform(DEFAULT_TRANSFORM);
      setTState(DEFAULT_TRANSFORM);
      didInit.current = false; // trigger auto-fit
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUrlLoad = () => {
    const url = urlInputValue.trim();
    if (!url) return;
    const isSvg = url.includes('.svg') || url.includes('svg');
    updateState({ imageUrl: url, isSvg, savedTransform: DEFAULT_TRANSFORM });
    transformRef.current = DEFAULT_TRANSFORM;
    applyTransform(DEFAULT_TRANSFORM);
    setTState(DEFAULT_TRANSFORM);
    didInit.current = false;
    setShowUrlInput(false);
    setUrlInputValue('');
  };

  // ── IMAGE LOAD → get natural dimensions ──────────────────────────────────
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth  || 2000;
    const h = img.naturalHeight || 1500;
    setMapSize({ w, h });
  }, []);

  // ── KEYBOARD shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsPlacingMarker(false); setPendingPosition(null); setEditingMarker(null); }
      if ((e.key === '=' || e.key === '+') && !e.target?.toString().includes('Input')) {
        if (containerRef.current) {
          const r = containerRef.current.getBoundingClientRect();
          zoomAt(r.left + r.width / 2, r.top + r.height / 2, ZOOM_FACTOR);
        }
      }
      if (e.key === '-' && !e.target?.toString().includes('Input')) {
        if (containerRef.current) {
          const r = containerRef.current.getBoundingClientRect();
          zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / ZOOM_FACTOR);
        }
      }
      if (e.key === '0') fitToScreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomAt, fitToScreen]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-slate-950 overflow-hidden" style={{ minHeight: 600 }}>

      {/* ── Main Map Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm shrink-0 flex-wrap gap-y-2">
          <div className="flex items-center gap-1.5">
            <Map size={15} className="text-amber-400" />
            <span className="font-bold text-sm text-slate-100">World Map</span>
          </div>

          {/* Upload / URL */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <Upload size={12} /> {mapState.imageUrl ? 'Replace' : 'Upload Map'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFileUpload} />

            <button
              onClick={() => setShowUrlInput(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-colors ${
                showUrlInput ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Globe size={12} /> SVG URL
            </button>

            <AnimatePresence>
              {showUrlInput && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex gap-1 overflow-hidden"
                >
                  <input
                    ref={svgUrlInputRef}
                    autoFocus
                    value={urlInputValue}
                    onChange={e => setUrlInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUrlLoad(); if (e.key === 'Escape') setShowUrlInput(false); }}
                    placeholder="Paste map image or SVG URL…"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button onClick={handleUrlLoad} className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold">
                    Load
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Marker */}
          <button
            onClick={() => { setIsPlacingMarker(v => !v); setPendingPosition(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-colors ${
              isPlacingMarker
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Plus size={12} /> {isPlacingMarker ? 'Click map to place…' : 'Add Marker'}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => containerRef.current && zoomAt(
                containerRef.current.getBoundingClientRect().left + containerRef.current.getBoundingClientRect().width / 2,
                containerRef.current.getBoundingClientRect().top  + containerRef.current.getBoundingClientRect().height / 2,
                ZOOM_FACTOR
              )}
              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => containerRef.current && zoomAt(
                containerRef.current.getBoundingClientRect().left + containerRef.current.getBoundingClientRect().width / 2,
                containerRef.current.getBoundingClientRect().top  + containerRef.current.getBoundingClientRect().height / 2,
                1 / ZOOM_FACTOR
              )}
              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom out (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={fitToScreen}
              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Fit to screen (0)"
            >
              <Maximize2 size={14} />
            </button>
            {/* Zoom level readout */}
            <span className="text-[10px] font-mono text-slate-600 w-12 text-right">
              {Math.round(tState.scale * 100)}%
            </span>
          </div>

          {/* Grid controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateState({ showGrid: !mapState.showGrid })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-xs font-semibold transition-colors ${
                mapState.showGrid ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Grid3X3 size={12} /> Grid
            </button>
            {mapState.showGrid && (
              <>
                <input
                  type="range" min={5} max={50} value={mapState.gridSize}
                  onChange={e => updateState({ gridSize: parseInt(e.target.value) })}
                  className="w-16 accent-amber-500" title="Grid density"
                />
                <input
                  type="range" min={5} max={80} value={mapState.gridOpacity}
                  onChange={e => updateState({ gridOpacity: parseInt(e.target.value) })}
                  className="w-16 accent-amber-500" title="Grid opacity"
                />
              </>
            )}
            <button
              onClick={() => setShowSidebar(v => !v)}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showSidebar ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* ── Map canvas ── */}
        <div
          ref={containerRef}
          className={`flex-1 relative overflow-hidden select-none ${isPlacingMarker ? 'cursor-crosshair' : isDragging.current ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ background: '#060810', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleContainerClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Transform group — apply to ref only, not state (performance) */}
          <div
            ref={contentRef}
            style={{
              transformOrigin: '0 0',
              transform: `translate(${tState.x}px, ${tState.y}px) scale(${tState.scale})`,
              willChange: 'transform',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {/* Map image / SVG */}
            {mapState.imageUrl ? (
              <div
                style={{ position: 'relative', width: mapSize.w, height: mapSize.h }}
              >
                {mapState.isSvg ? (
                  // SVG loaded as <img> tag still benefits from infinite-resolution render
                  <img
                    src={mapState.imageUrl}
                    alt="World Map"
                    style={{ width: mapSize.w, height: mapSize.h, display: 'block', imageRendering: 'auto' }}
                    onLoad={handleImageLoad}
                    ref={mapImgRef}
                    draggable={false}
                  />
                ) : (
                  <img
                    src={mapState.imageUrl}
                    alt="World Map"
                    style={{ width: mapSize.w, height: mapSize.h, display: 'block' }}
                    onLoad={handleImageLoad}
                    ref={mapImgRef}
                    draggable={false}
                  />
                )}

                {/* Grid overlay */}
                {mapState.showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,${mapState.gridOpacity / 1000}) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,${mapState.gridOpacity / 1000}) 1px, transparent 1px)
                      `,
                      backgroundSize: `${mapSize.w / mapState.gridSize}px ${mapSize.h / mapState.gridSize}px`,
                    }}
                  />
                )}

                {/* Markers — inside transform, counter-scale so they stay constant visual size */}
                {mapState.markers.map(marker => {
                  const markerLeft = (marker.x / 100) * mapSize.w;
                  const markerTop  = (marker.y / 100) * mapSize.h;
                  return (
                    <div
                      key={marker.id}
                      className="absolute z-10"
                      style={{
                        left: markerLeft,
                        top: markerTop,
                        transform: `translate(-50%, -50%) scale(calc(1 / var(--map-scale, 1)))`,
                        transformOrigin: 'center',
                        cursor: isPlacingMarker ? 'crosshair' : 'pointer',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        if (!isPlacingMarker) {
                          setSelectedMarker(prev => prev?.id === marker.id ? null : marker);
                        }
                      }}
                      onMouseEnter={() => setHoveredMarkerId(marker.id)}
                      onMouseLeave={() => setHoveredMarkerId(null)}
                    >
                      <MarkerIcon type={marker.type} visited={marker.visited} pinned={marker.pinned} />

                      {/* Tooltip — also counter-scaled */}
                      {hoveredMarkerId === marker.id && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none whitespace-nowrap z-20"
                        >
                          <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold shadow-xl">
                            {marker.label}
                            {marker.visited && <span className="ml-1.5 text-slate-500">✓</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Placement indicator (viewport overlay) */}
          {isPlacingMarker && (
            <div className="absolute inset-0 pointer-events-none border-2 border-amber-500/40 rounded-sm animate-pulse" />
          )}

          {/* Empty state */}
          {!mapState.imageUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-3 opacity-50">
                <Map size={64} className="text-slate-600" />
                <p className="text-slate-400 font-semibold">No map loaded</p>
                <p className="text-slate-600 text-sm text-center max-w-xs">
                  Upload an image or paste an SVG URL to get started.<br/>
                  Tip: Azgaar's Fantasy Map Generator exports perfect SVGs.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/80 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Upload size={14} /> Upload Map
                </button>
                <button
                  onClick={() => { setShowUrlInput(true); setTimeout(() => svgUrlInputRef.current?.focus(), 50); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Globe size={14} /> Load from URL
                </button>
              </div>
            </div>
          )}

          {/* Pending placement popup — positioned in screen space */}
          {pendingPosition && (() => {
            const pos = mapPctToScreen(pendingPosition.x, pendingPosition.y);
            return (
              <div
                className="absolute z-30 w-72 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, 12px)' }}
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                  <span className="text-xs font-bold text-slate-100">Place Marker</span>
                  <button onClick={() => { setPendingPosition(null); setIsPlacingMarker(false); }} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
                </div>
                <MarkerForm
                  initial={pendingPosition}
                  onSave={addMarker}
                  onCancel={() => { setPendingPosition(null); setIsPlacingMarker(false); }}
                />
              </div>
            );
          })()}

          {/* Edit marker popup — positioned in screen space */}
          {editingMarker && (() => {
            const pos = mapPctToScreen(editingMarker.x, editingMarker.y);
            return (
              <div
                className="absolute z-30 w-72 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, 12px)' }}
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                  <span className="text-xs font-bold text-slate-100">Edit Marker</span>
                  <button onClick={() => setEditingMarker(null)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
                </div>
                <MarkerForm
                  initial={editingMarker}
                  onSave={m => updateMarker(editingMarker.id, m)}
                  onCancel={() => setEditingMarker(null)}
                />
              </div>
            );
          })()}

          {/* Zoom hint */}
          {mapState.imageUrl && (
            <div className="absolute bottom-3 right-3 text-[9px] text-slate-700 font-mono pointer-events-none">
              scroll to zoom · drag to pan · 0 to fit
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar: Marker List ── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden shrink-0"
          >
            {/* Selected marker details */}
            <AnimatePresence>
              {selectedMarker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="border-b border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <MarkerIcon type={selectedMarker.type} visited={selectedMarker.visited} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-100 truncate">{selectedMarker.label}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide">{MARKER_ICONS[selectedMarker.type].label}</p>
                    </div>
                    <button onClick={() => setSelectedMarker(null)} className="text-slate-600 hover:text-slate-400">
                      <X size={12} />
                    </button>
                  </div>
                  {selectedMarker.notes && (
                    <p className="text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">{selectedMarker.notes}</p>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        // Fly to the marker
                        if (!containerRef.current) return;
                        const rect = containerRef.current.getBoundingClientRect();
                        const newScale = Math.max(tState.scale, 2);
                        const mapX = (selectedMarker.x / 100) * mapSize.w;
                        const mapY = (selectedMarker.y / 100) * mapSize.h;
                        const newX = rect.width  / 2 - mapX * newScale;
                        const newY = rect.height / 2 - mapY * newScale;
                        commitTransform({ scale: newScale, x: newX, y: newY });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-semibold transition-colors">
                      <MapPin size={10} /> Fly to
                    </button>
                    <button onClick={() => setEditingMarker(selectedMarker)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition-colors">
                      <Pencil size={10} /> Edit
                    </button>
                    <button onClick={() => {
                        updateState({ markers: mapState.markers.map(m => m.id === selectedMarker.id ? { ...m, visited: !m.visited } : m) });
                        setSelectedMarker(prev => prev ? { ...prev, visited: !prev.visited } : null);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg text-[10px] font-semibold transition-colors ${
                        selectedMarker.visited ? 'bg-green-900/30 border-green-700/30 text-green-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}>
                      <Check size={10} /> {selectedMarker.visited ? 'Visited' : 'Mark visited'}
                    </button>
                    <button onClick={() => deleteMarker(selectedMarker.id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-red-900/20 hover:bg-red-900/40 border border-red-800/30 text-red-400 rounded-lg text-[10px] font-semibold transition-colors">
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Marker list header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Markers ({mapState.markers.length})
              </span>
              <button
                onClick={() => setIsPlacingMarker(true)}
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[9px] font-bold transition-colors"
              >
                <Plus size={10} /> Add
              </button>
            </div>

            {/* Marker list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {mapState.markers.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <MapPin size={24} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-xs">No markers yet</p>
                  <p className="text-[9px] mt-1">Click "Add Marker" and click on the map</p>
                </div>
              ) : (
                (Object.keys(MARKER_ICONS) as MarkerType[])
                  .filter(t => mapState.markers.some(m => m.type === t))
                  .map(type => {
                    const typeMarkers = mapState.markers.filter(m => m.type === type);
                    const { label, color } = MARKER_ICONS[type];
                    return (
                      <div key={type} className="mb-2">
                        <p className="text-[8px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color }}>
                          {label} ({typeMarkers.length})
                        </p>
                        {typeMarkers.map(m => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMarker(prev => prev?.id === m.id ? null : m)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
                              selectedMarker?.id === m.id
                                ? 'bg-amber-500/10 border border-amber-500/20'
                                : 'hover:bg-slate-800 border border-transparent'
                            }`}
                          >
                            <MarkerIcon type={m.type} visited={m.visited} size={20} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${m.visited ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {m.label}
                              </p>
                              {m.notes && <p className="text-[9px] text-slate-600 truncate">{m.notes}</p>}
                            </div>
                            {m.pinned && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Legend */}
            <div className="p-3 border-t border-slate-800 shrink-0">
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mb-2">Legend</p>
              <div className="grid grid-cols-2 gap-1">
                {(Object.entries(MARKER_ICONS) as [MarkerType, any][]).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: v.color }} />
                    <span className="text-[8px] text-slate-500">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
