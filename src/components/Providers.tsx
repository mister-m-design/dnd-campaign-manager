"use client";

import React from 'react';
import { DiceProvider, useDice } from '@/contexts/DiceContext';
import DiceWidget from '@/components/combat/DiceWidget';
import { AnimatePresence } from 'framer-motion';

function GlobalDiceWidget() {
  const { 
    isDiceOpen, 
    setIsDiceOpen, 
    dicePreloadFormula, 
    setDicePreloadFormula, 
    diceContextLabel, 
    setDiceContextLabel,
    setConfirmedRoll,
    setLastFreeRoll
  } = useDice();

  return (
    <AnimatePresence>
      {isDiceOpen && (
        <DiceWidget
          isOpen={isDiceOpen}
          onClose={() => {
            setIsDiceOpen(false);
            setDicePreloadFormula(undefined);
            setDiceContextLabel(undefined);
          }}
          preloadFormula={dicePreloadFormula}
          contextLabel={diceContextLabel}
          onRoll={(result) => {
            if (diceContextLabel) {
              setConfirmedRoll({ value: result.total, id: `${Date.now()}-${Math.random()}` });
            } else {
              setLastFreeRoll({ formula: result.formula, total: result.total });
            }
          }}
        />
      )}
    </AnimatePresence>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DiceProvider>
      {children}
      <GlobalDiceWidget />
    </DiceProvider>
  );
}
