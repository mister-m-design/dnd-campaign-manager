
import { CombatantState, Action, GameState } from '../types';
import { RulesEngine } from './RulesEngine';

export interface CombatAction {
    type: 'attack' | 'move' | 'end';
    action?: Action;
    targetId?: string;
    position?: { x: number, y: number };
}

export class DecisionEngine {
    static getNextMove(monster: CombatantState, state: GameState): CombatAction {
        // Only monsters act autonomously in this simple AI
        if (monster.side !== 'Enemy' || monster.currentHP <= 0) return { type: 'end' };

        // 1. Find targets (Allies in combat)
        const targets = state.combatants.filter(c => c.side === 'Ally' && c.currentHP > 0);
        if (targets.length === 0) return { type: 'end' };

        // 2. Find nearest target
        let nearestTarget = targets[0];
        let minDistance = Infinity;

        targets.forEach(t => {
            const dist = this.calculateDistance(monster.position || {x: 0, y: 0}, t.position || {x: 0, y: 0});
            if (dist < minDistance) {
                minDistance = dist;
                nearestTarget = t;
            }
        });

        // 3. Check if any action is available
        const availableActions = monster.actions.filter(a => a.actionType === 'Attack' || a.actionType === 'Spell');
        const bestAction = availableActions[0]; // Simple AI: use first attack

        if (!bestAction) return { type: 'end' };

        // Scale: 10px = 1ft. Typical melee reach is 5ft = 50px.
        const REACH = 60; // Slightly more than 5ft to be safe

        if (minDistance <= REACH) {
            // In range, attack!
            return {
                type: 'attack',
                action: bestAction,
                targetId: nearestTarget.instanceId
            };
        } else {
            // Out of range, move towards target
            const moveDist = Math.min(monster.resources.movementRemaining * 10, minDistance - REACH + 10);
            if (moveDist <= 0) return { type: 'end' };

            const dx = (nearestTarget.position?.x || 0) - (monster.position?.x || 0);
            const dy = (nearestTarget.position?.y || 0) - (monster.position?.y || 0);
            const angle = Math.atan2(dy, dx);

            const newX = (monster.position?.x || 0) + Math.cos(angle) * moveDist;
            const newY = (monster.position?.y || 0) + Math.sin(angle) * moveDist;

            return {
                type: 'move',
                position: { x: newX, y: newY }
            };
        }
    }

    private static calculateDistance(p1: {x: number, y: number}, p2: {x: number, y: number}): number {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
}
