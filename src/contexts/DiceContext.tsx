"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DiceRollResult } from '@/components/combat/DiceWidget';

interface DiceContextType {
  isDiceOpen: boolean;
  setIsDiceOpen: (open: boolean) => void;
  dicePreloadFormula: string | undefined;
  setDicePreloadFormula: (formula: string | undefined) => void;
  diceContextLabel: string | undefined;
  setDiceContextLabel: (label: string | undefined) => void;
  confirmedRoll: { value: number; id: string } | null;
  setConfirmedRoll: (roll: { value: number; id: string } | null) => void;
  lastFreeRoll: { formula: string; total: number } | null;
  setLastFreeRoll: (roll: { formula: string; total: number } | null) => void;
}

const DiceContext = createContext<DiceContextType | undefined>(undefined);

export function DiceProvider({ children }: { children: ReactNode }) {
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [dicePreloadFormula, setDicePreloadFormula] = useState<string | undefined>(undefined);
  const [diceContextLabel, setDiceContextLabel] = useState<string | undefined>(undefined);
  const [confirmedRoll, setConfirmedRoll] = useState<{ value: number; id: string } | null>(null);
  const [lastFreeRoll, setLastFreeRoll] = useState<{ formula: string; total: number } | null>(null);

  return (
    <DiceContext.Provider value={{
      isDiceOpen,
      setIsDiceOpen,
      dicePreloadFormula,
      setDicePreloadFormula,
      diceContextLabel,
      setDiceContextLabel,
      confirmedRoll,
      setConfirmedRoll,
      lastFreeRoll,
      setLastFreeRoll
    }}>
      {children}
    </DiceContext.Provider>
  );
}

export function useDice() {
  const context = useContext(DiceContext);
  if (context === undefined) {
    throw new Error('useDice must be used within a DiceProvider');
  }
  return context;
}
