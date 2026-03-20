
import { Ability, AbilityScores, Action, Character, CombatantState, GameState, LogEntry } from '../types';

export class RulesEngine {
  static calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  static getProficiencyBonus(level: number): number {
    return 2 + Math.floor((level - 1) / 4);
  }

  static getDerivedStats(combatant: CombatantState) {
    const dexMod = this.calculateModifier(combatant.abilityScores.DEX);
    const conMod = this.calculateModifier(combatant.abilityScores.CON);
    const wisMod = this.calculateModifier(combatant.abilityScores.WIS);
    const intMod = this.calculateModifier(combatant.abilityScores.INT);
    const proficiencyBonus = this.getProficiencyBonus(combatant.level);

    let ac = combatant.baseAC;
    let acFormula = 'Base';

    if (combatant.isWildShaped) {
        acFormula = 'Beast Form';
    } else {
        if (combatant.class === 'Barbarian' && !combatant.status.includes('Wearing Armor')) {
            ac = 10 + dexMod + conMod;
            acFormula = 'Unarmored Defense (Barbarian)';
        } else if (combatant.class === 'Monk' && !combatant.status.includes('Wearing Armor') && !combatant.status.includes('Shield Equipped')) {
            ac = 10 + dexMod + wisMod;
            acFormula = 'Unarmored Defense (Monk)';
        } else if (combatant.status.includes('Mage Armor')) {
            ac = 13 + dexMod;
            acFormula = 'Mage Armor';
        } else if (combatant.class === 'Druid' && (combatant as any).loadout === 'Default') {
            ac = 11 + dexMod + 2; 
            acFormula = 'Leather + Shield';
        }
    }

    if (combatant.status.includes('Shield Equipped') && !acFormula.includes('Shield')) {
        ac += 2;
    }

    return {
      ac,
      acFormula,
      proficiencyBonus,
      spellSaveDC: 8 + (combatant.class === 'Wizard' ? intMod : wisMod) + proficiencyBonus,
      spellAttackBonus: (combatant.class === 'Wizard' ? intMod : wisMod) + proficiencyBonus,
      initiativeBonus: dexMod,
    };
  }

  static rollInitiative(combatant: any): number {
    const scores = combatant.abilityScores || combatant.abilities || combatant.stats || { DEX: 10 };
    const dexMod = this.calculateModifier(scores.DEX ?? 10);
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + dexMod;
  }

  static validateAction(combatant: CombatantState, action: Action): { valid: boolean; reason?: string } {
    if (combatant.conditions.includes('Incapacitated') || combatant.conditions.includes('Stunned') || combatant.conditions.includes('Unconscious')) {
        return { valid: false, reason: 'Combatant is incapacitated' };
    }

    if (action.type === 'Action' && combatant.resources.actionUsed) return { valid: false, reason: 'Action already used' };
    if (action.type === 'Bonus Action' && combatant.resources.bonusActionUsed) return { valid: false, reason: 'Bonus Action already used' };
    if (action.type === 'Reaction' && combatant.resources.reactionUsed) return { valid: false, reason: 'Reaction already used' };
    return { valid: true };
  }

  static resolveConcentrationCheck(combatant: CombatantState, damage: number): { success: boolean; roll: number; dc: number } {
      const dc = Math.max(10, Math.floor(damage / 2));
      const conMod = this.calculateModifier(combatant.abilityScores.CON);
      const isProficient = combatant.class === 'Sorcerer'; 
      const bonus = isProficient ? this.getProficiencyBonus(combatant.level) : 0;
      
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + conMod + bonus;
      
      return {
          success: total >= dc,
          roll: total,
          dc
      };
  }

  static checkSneakAttack(attacker: CombatantState, target: CombatantState, action: Action, allCombatants?: CombatantState[]): { valid: boolean; reason?: string } {
      if (attacker.class !== 'Rogue') return { valid: false, reason: 'Not a Rogue' };
      
      const isFinesse = (action.description || '').toLowerCase().includes('finesse');
      const isRanged = action.attackType === 'Ranged' || (action.range && action.range.includes('/'));
      
      if (!isFinesse && !isRanged) return { valid: false, reason: 'Must use Finesse or Ranged weapon' };
      
      const toHit = this.resolveToHit(attacker, target, action, 10);
      if (toHit.rollMode === 'Advantage') return { valid: true };
      if (toHit.rollMode === 'Disadvantage') return { valid: false, reason: 'Cannot Sneak Attack with Disadvantage' };

      // Check for ally within 5ft of target
      if (allCombatants && target.position) {
          const targetPos = target.position;
          const allyNearby = allCombatants.some(c => 
              c.instanceId !== attacker.instanceId && 
              c.instanceId !== target.instanceId &&
              c.side === attacker.side &&
              c.currentHP > 0 &&
              c.position && 
              Math.sqrt(Math.pow(c.position.x - targetPos.x, 2) + Math.pow(c.position.y - targetPos.y, 2)) <= 7.5 // 5ft + buffer
          );
          if (allyNearby) return { valid: true };
      }
      
      return { valid: false, reason: 'No advantage or ally within 5ft of target' };
  }

  static resolveRecharge(combatant: CombatantState): { id: string; name: string; recharged: boolean }[] {
      if (!combatant.rechargeAbilities) return [];
      
      return combatant.rechargeAbilities.filter(a => a.used).map(ability => {
          const roll = Math.floor(Math.random() * 6) + 1;
          const recharged = (ability.rechargeOn || [5, 6]).includes(roll);
          return { id: ability.id, name: ability.name, recharged };
      });
  }

  static resolveMovement(combatant: CombatantState, distance: number, isDifficult: boolean = false): { cost: number; canMove: boolean } {
      let cost = isDifficult ? distance * 2 : distance;
      if (combatant.conditions.includes('Prone')) {
          cost += 15; // Standing up costs 15ft
      }
      return { cost, canMove: combatant.resources.movementRemaining >= cost };
  }

  static resolveWildShape(druid: CombatantState, beast: any): CombatantState {
    if (druid.isWildShaped) {
        return this.revertWildShape(druid);
    }

    const originalStats = { ...druid.abilityScores };
    const originalAC = druid.baseAC;
    const originalActions = [...druid.actions];
    const originalSpeed = druid.speed;

    const newStats: AbilityScores = {
      STR: beast.stats?.STR || 10,
      DEX: beast.stats?.DEX || 10,
      CON: beast.stats?.CON || 10,
      INT: druid.abilityScores.INT,
      WIS: druid.abilityScores.WIS,
      CHA: druid.abilityScores.CHA
    };

    const beastActions: Action[] = (beast.actions || []).map((action: any, idx: number) => {
        if (typeof action === 'string') {
            return {
                id: `${druid.instanceId}-ws-${idx}`,
                name: action.split(':')[0] || 'Attack',
                description: action,
                type: 'Action',
                actionType: 'Attack',
                source: 'Form'
            };
        }
        return action;
    });

    return {
      ...druid,
      portrait: beast.visualUrl || druid.portrait,
      isWildShaped: true,
      currentHP: beast.hp || druid.currentHP, 
      tempHP: druid.level, 
      abilityScores: newStats,
      baseAC: beast.ac || 10,
      actions: beastActions,
      speed: beast.speed || 30,
      wildShapeData: {
        originalStats: druid.abilityScores,
        originalHP: druid.currentHP,
        originalMaxHP: druid.maxHP,
        originalPortrait: druid.portrait || "",
        originalAC: druid.baseAC,
        originalActions: druid.actions,
        originalSpeed: druid.speed,
        beastName: beast.name
      },
      resources: {
        ...druid.resources,
        movementMax: beast.speed || 30,
        movementRemaining: Math.min(druid.resources.movementRemaining, beast.speed || 30),
        bonusActionUsed: true
      }
    };
  }

  static revertWildShape(druid: CombatantState): CombatantState {
      if (!druid.wildShapeData) return druid;

      return {
        ...druid,
        isWildShaped: false,
        portrait: druid.wildShapeData.originalPortrait,
        abilityScores: druid.wildShapeData.originalStats,
        baseAC: druid.wildShapeData.originalAC,
        actions: druid.wildShapeData.originalActions,
        speed: druid.wildShapeData.originalSpeed,
        wildShapeData: undefined,
      };
  }

  /**
   * STAGE 1: TO HIT
   */
  static resolveToHit(
    attacker: CombatantState, 
    target: CombatantState, 
    action: Action, 
    manualD20?: number
  ): { 
      hit: boolean; 
      d20: number;
      total: number;
      isCrit: boolean;
      isNat1: boolean;
      ac: number;
      log: string;
      rollMode: 'Normal' | 'Advantage' | 'Disadvantage';
  } {
    const targetDerived = this.getDerivedStats(target);
    const attackBonus = action.attackBonus ?? action.toHitBonus ?? 0;
    
    // Condition Logic
    let rollMode: 'Normal' | 'Advantage' | 'Disadvantage' = 'Normal';
    
    const distance = attacker.position && target.position 
        ? Math.sqrt(Math.pow(attacker.position.x - target.position.x, 2) + Math.pow(attacker.position.y - target.position.y, 2)) / 10
        : 5;

    // Advantage sources (conditions + DM flags + Hidden state)
    const hasAdvantage =
        target.conditions.includes('Blinded') ||
        target.conditions.includes('Paralyzed') ||
        target.conditions.includes('Petrified') ||
        target.conditions.includes('Restrained') ||
        target.conditions.includes('Stunned') ||
        target.conditions.includes('Unconscious') ||
        (target.conditions.includes('Prone') && distance <= 5) ||
        attacker.conditions.includes('Invisible') ||
        attacker.conditions.includes('Hidden') ||   // Hidden attacker has advantage
        attacker.conditions.includes('Advantage') || // DM-forced advantage
        (attacker as any).forceAdvantage === true;

    // Disadvantage sources (conditions + DM flags)
    const hasDisadvantage =
        attacker.conditions.includes('Blinded') ||
        attacker.conditions.includes('Frightened') ||
        attacker.conditions.includes('Poisoned') ||
        (target.conditions.includes('Prone') && distance > 5) ||
        target.conditions.includes('Dodge') ||
        attacker.conditions.includes('Disadvantage') || // DM-forced disadvantage
        (attacker as any).forceDisadvantage === true;

    if (hasAdvantage && !hasDisadvantage) rollMode = 'Advantage';
    if (!hasAdvantage && hasDisadvantage) rollMode = 'Disadvantage';

    let d20 = manualD20;
    if (d20 === undefined) {
        if (rollMode === 'Normal') {
            d20 = Math.floor(Math.random() * 20) + 1;
        } else if (rollMode === 'Advantage') {
            d20 = Math.max(Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1);
        } else {
            d20 = Math.min(Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1);
        }
    }

    const totalAttackRoll = d20 + attackBonus;
    const isCrit = d20 === 20;
    const isNat1 = d20 === 1;
    const hit = isCrit || (!isNat1 && totalAttackRoll >= targetDerived.ac);

    const resultLabel = isCrit ? 'CRITICAL HIT' : (hit ? 'HIT' : 'MISS');
    const log = `${attacker.name} uses ${action.name} on ${target.name} [${rollMode}] -> Roll ${d20} + ${attackBonus} = ${totalAttackRoll} -> ${resultLabel} (Target AC: ${targetDerived.ac})`;

    return {
      hit,
      d20,
      total: totalAttackRoll,
      isCrit,
      isNat1,
      ac: targetDerived.ac,
      log,
      rollMode
    };
  }

  /**
   * STAGE 2: DAMAGE
   */
  static resolveDamage(
    attacker: CombatantState,
    target: CombatantState,
    action: Action,
    isCrit: boolean,
    manualDamage?: number,
    smiteSlot?: number
  ): {
      damage: number;
      log: string;
      breakdown: string;
  } {
    let damage = manualDamage;
    let breakdown = '';

    // Automatic Crits for certain conditions
    const distance = attacker.position && target.position 
        ? Math.sqrt(Math.pow(attacker.position.x - target.position.x, 2) + Math.pow(attacker.position.y - target.position.y, 2)) / 10
        : 5;
    
    let effectiveCrit = isCrit;
    if (distance <= 5 && (target.conditions.includes('Paralyzed') || target.conditions.includes('Unconscious'))) {
        effectiveCrit = true;
    }

    if (damage === undefined) {
        let currentDamageDice = action.damageDice || "1d8";
        const scores = attacker.abilityScores || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
        const strMod = this.calculateModifier(scores.STR ?? 10);
        const dexMod = this.calculateModifier(scores.DEX ?? 10);
        
        const isFinesse = (action.description || '').toLowerCase().includes('finesse');
        const isRanged = action.attackType === 'Ranged' || (action.range && action.range.includes('/'));
        
        let modifier = action.damageModifier;
        if (modifier === undefined || (modifier === 0 && action.actionType === 'Attack')) {
            modifier = isRanged ? dexMod : (isFinesse ? Math.max(strMod, dexMod) : strMod);
        }

        if (attacker.conditions.includes('Rage') && !isRanged) {
            modifier += (attacker.level >= 16 ? 4 : attacker.level >= 9 ? 3 : 2);
        }

        // Cantrip Scaling (Levels 5, 11, 17)
        if (action.spellLevel === 0 && action.attackType === 'Spell') {
            const [countStr, sidesStr] = currentDamageDice.split('d');
            let count = parseInt(countStr) || 1;
            const scaling = attacker.level >= 17 ? 3 : attacker.level >= 11 ? 2 : attacker.level >= 5 ? 1 : 0;
            count += scaling;
            currentDamageDice = `${count}d${sidesStr}`;
        }

        const [countStr, sidesStr] = currentDamageDice.split('d');
        const count = parseInt(countStr) || 1;
        const sides = parseInt(sidesStr) || 8;
        
        const totalRolls = effectiveCrit ? count * 2 : count;
        const rolls: number[] = [];
        let diceSum = 0;
        
        for (let i = 0; i < totalRolls; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            diceSum += roll;
        }

        // Sneak Attack (1d6 per 2 levels, rounded up: 1, 3, 5...)
        if (action.isSneakAttack && attacker.class === 'Rogue') {
            const sneakCount = Math.ceil(attacker.level / 2);
            const sneakRolls = effectiveCrit ? sneakCount * 2 : sneakCount;
            for (let i = 0; i < sneakRolls; i++) {
                const roll = Math.floor(Math.random() * 6) + 1;
                rolls.push(roll);
                diceSum += roll;
            }
        }

        // Divine Smite
        if (smiteSlot && smiteSlot > 0) {
            let smiteDice = smiteSlot + 1;
            if (['Undead', 'Fiend'].includes(target.species)) smiteDice += 1;
            const smiteRolls = effectiveCrit ? smiteDice * 2 : smiteDice;
            for (let i = 0; i < smiteRolls; i++) {
                const roll = Math.floor(Math.random() * 8) + 1;
                rolls.push(roll);
                diceSum += roll;
            }
        }
        
        damage = diceSum + (modifier || 0);

        const damageType = action.damageType || 'Physical';
        const isResistant = target.status.includes(`Resist-${damageType}`) || 
                           (target.conditions.includes('Rage') && ['Bludgeoning', 'Piercing', 'Slashing', 'Physical'].includes(damageType));
        const isVulnerable = target.status.includes(`Vuln-${damageType}`);

        if (isResistant || target.status.includes('Resistant')) {
            damage = Math.floor(damage / 2);
            breakdown = `RESISTANT: (${rolls.join(' + ')} ${modifier > 0 ? `+ ${modifier}` : ''}) / 2`;
        } else if (isVulnerable) {
            damage = damage * 2;
            breakdown = `VULNERABLE: (${rolls.join(' + ')} ${modifier > 0 ? `+ ${modifier}` : ''}) * 2`;
        } else {
            breakdown = `${rolls.join(' + ')} ${modifier > 0 ? `+ ${modifier}` : ''}`;
        }
    } else {
        breakdown = `Manual Selection`;
    }

    const log = `${attacker.name} deals ${damage} ${action.damageType || 'damage'} to ${target.name}. (${breakdown})`;

    return {
      damage,
      log,
      breakdown
    };
  }

  // Legacy support for single-call resolution
  static resolveAttack(
    attacker: CombatantState, 
    target: CombatantState, 
    action: Action, 
    manualD20?: number, 
    manualDamage?: number
  ) {
    const toHit = this.resolveToHit(attacker, target, action, manualD20);
    if (!toHit.hit) return { ...toHit, damage: 0, breakdown: '', log: toHit.log };
    
    const damage = this.resolveDamage(attacker, target, action, toHit.isCrit, manualDamage);
    return {
        ...toHit,
        ...damage,
        log: `${toHit.log} -> ${damage.log}`
    };
  }

  static resolveDeathSave(combatant: CombatantState, manualRoll?: number): { success: boolean, total: number, log: string, isStable: boolean, isDead: boolean } {
      const d20 = manualRoll !== undefined ? Math.max(1, Math.min(20, manualRoll)) : Math.floor(Math.random() * 20) + 1;
      let successes = combatant.deathSaves.successes;
      let failures = combatant.deathSaves.failures;
      let log = `${combatant.name} rolls a Death Save: ${d20}. `;
      let isStable = false;
      let isDead = false;

      if (d20 === 20) {
          log += "NATURAL 20! Regains 1 HP and stabilizes.";
          isStable = true;
      } else if (d20 === 1) {
          log += "NATURAL 1! Two failures.";
          failures += 2;
      } else if (d20 >= 10) {
          log += "Success.";
          successes += 1;
      } else {
          log += "Failure.";
          failures += 1;
      }

      if (successes >= 3) {
          log += " Character is stable.";
          isStable = true;
      }
      if (failures >= 3) {
          log += " Character is dead.";
          isDead = true;
      }

      return { success: d20 >= 10, total: d20, log, isStable, isDead };
  }
}
