import { DiceEngine } from './src/lib/dice.ts';

console.log('--- Dice Engine Test ---');

const tests = ['d20', '2d6+3', 'd20adv', 'd20dis', '1d12-1', '10', 'd100'];

tests.forEach(t => {
    const res = DiceEngine.roll(t);
    console.log(`Roll [${t}]: Total = ${res.total}, Rolls = [${res.rolls}], Modifier = ${res.modifier}, Type = ${res.type}`);
});
