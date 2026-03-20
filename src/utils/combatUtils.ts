import { Action } from '../types';

export const STD_ACTIONS = [
    { id: 'std-attack', name: 'Attack', icon: 'swords', description: 'Make a melee or ranged weapon attack.' },
    { id: 'std-dash', name: 'Dash', icon: 'bolt', description: 'Gain extra movement for the current turn.' },
    { id: 'std-disengage', name: 'Disengage', icon: 'directions_run', description: 'Your movement doesn\'t provoke opportunity attacks.' },
    { id: 'std-dodge', name: 'Dodge', icon: 'security', description: 'Attack rolls against you have disadvantage if you can see the attacker.' },
    { id: 'std-help', name: 'Help', icon: 'front_hand', description: 'Give an ally advantage on their next ability check or attack roll.' },
    { id: 'std-hide', name: 'Hide', icon: 'visibility_off', description: 'Attempt to hide from enemies (Dexterity check vs Perception).' },
    { id: 'std-ready', name: 'Ready', icon: 'timer', description: 'Prepare an action to be triggered by a specific event.' },
    { id: 'std-search', name: 'Search', icon: 'search', description: 'Devote your attention to finding something (Perception or Investigation).' }
];

export const COND_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
    Blinded:       { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: 'visibility_off' },
    Charmed:       { color: '#f472b6', bg: 'rgba(244,114,182,0.15)', icon: 'favorite' },
    Deafened:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: 'hearing_disabled' },
    Frightened:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  icon: 'sentiment_very_dissatisfied' },
    Grappled:      { color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  icon: 'pan_tool' },
    Incapacitated: { color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: 'do_not_disturb' },
    Invisible:     { color: '#818cf8', bg: 'rgba(129,140,248,0.15)', icon: 'blur_off' },
    Paralyzed:     { color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: 'block' },
    Petrified:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: 'diamond' },
    Poisoned:      { color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  icon: 'science' },
    Prone:         { color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  icon: 'accessibility_new' },
    Restrained:    { color: '#f97316', bg: 'rgba(249,115,22,0.15)',  icon: 'lock' },
    Stunned:       { color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: 'electric_bolt' },
    Unconscious:   { color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: 'bedtime' },
    Exhausted:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: 'hourglass_empty' },
    Concentrating: { color: '#c084fc', bg: 'rgba(192,132,252,0.15)', icon: 'psychology' },
    Blessed:       { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  icon: 'auto_awesome' },
    Cursed:        { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  icon: 'dark_mode' },
    Raging:        { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: 'whatshot' },
    Dodge:         { color: '#22d3ee', bg: 'rgba(34,211,238,0.15)',  icon: 'shield' },
    Hasted:        { color: '#22d3ee', bg: 'rgba(34,211,238,0.15)',  icon: 'fast_forward' },
    Slowed:        { color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: 'slow_motion_video' },
    Hidden:        { color: '#64748b', bg: 'rgba(100,116,139,0.15)', icon: 'person_off' },
};

export function getCondColor(cond: string) {
    return COND_CONFIG[cond] || { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', icon: 'circle' };
}
