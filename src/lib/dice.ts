/**
 * Dice Engine for D&D Campaign Manager
 * Supports: d20, 2d6+3, d20adv, d20dis, etc.
 */

export interface RollResult {
    notation: string;
    rolls: number[];
    modifier: number;
    total: number;
    type: 'normal' | 'advantage' | 'disadvantage';
    isCritical?: boolean;
    isFumble?: boolean;
}

export class DiceEngine {
    /**
     * Parses a roll string and returns the result.
     * Example: "2d6+3", "d20adv", "d10"
     */
    static roll(notation: string): RollResult {
        const cleanNotation = notation.toLowerCase().replace(/\s+/g, '');
        let type: 'normal' | 'advantage' | 'disadvantage' = 'normal';
        let diceNotation = cleanNotation;

        if (cleanNotation.endsWith('adv')) {
            type = 'advantage';
            diceNotation = cleanNotation.slice(0, -3);
        } else if (cleanNotation.endsWith('dis')) {
            type = 'disadvantage';
            diceNotation = cleanNotation.slice(0, -3);
        }

        // Split by + or - to get the dice part and modifier
        const parts = diceNotation.split(/([+-])/);
        const primaryPart = parts[0]; // e.g., "2d6" or "10"
        let modifier = 0;

        if (parts.length > 2) {
            const op = parts[1];
            const val = parseInt(parts[2], 10);
            modifier = op === '+' ? val : -val;
        }

        // Parse primary part (XdY)
        const diceMatch = primaryPart.match(/^(\d*)d(\d+)$/);

        if (diceMatch) {
            const count = parseInt(diceMatch[1] || '1', 10);
            const sides = parseInt(diceMatch[2], 10);

            if (type === 'normal') {
                const rolls = Array.from({ length: count }, () => this.getRandomInt(1, sides));
                const res: RollResult = {
                    notation,
                    rolls,
                    modifier,
                    total: rolls.reduce((a, b) => a + b, 0) + modifier,
                    type
                };
                if (sides === 20 && count === 1) {
                    if (rolls[0] === 20) res.isCritical = true;
                    if (rolls[0] === 1) res.isFumble = true;
                }
                return res;
            } else {
                const firstRolls = Array.from({ length: count }, () => this.getRandomInt(1, sides));
                const secondRolls = Array.from({ length: count }, () => this.getRandomInt(1, sides));

                const firstTotal = firstRolls.reduce((a, b) => a + b, 0);
                const secondTotal = secondRolls.reduce((a, b) => a + b, 0);

                const finalRolls = type === 'advantage'
                    ? (firstTotal >= secondTotal ? firstRolls : secondRolls)
                    : (firstTotal <= secondTotal ? firstRolls : secondRolls);

                const res: RollResult = {
                    notation,
                    rolls: finalRolls,
                    modifier,
                    total: finalRolls.reduce((a, b) => a + b, 0) + modifier,
                    type
                };
                if (sides === 20 && count === 1) {
                    if (finalRolls[0] === 20) res.isCritical = true;
                    if (finalRolls[0] === 1) res.isFumble = true;
                }
                return res;
            }
        } else {
            // Just a number?
            const val = parseInt(primaryPart, 10) || 0;
            return {
                notation,
                rolls: [val],
                modifier,
                total: val + modifier,
                type: 'normal'
            };
        }
    }

    private static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
