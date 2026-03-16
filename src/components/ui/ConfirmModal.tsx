"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    icon?: string;
    variant?: 'danger' | 'warning';
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    icon = 'warning',
    variant = 'danger',
}: ConfirmModalProps) => {
    const color = variant === 'danger' ? 'red' : 'amber';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`bg-[#111827] border border-${color}-500/20 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`size-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
                                <span className={`material-symbols-outlined text-${color}-500`}>{icon}</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight">{title}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-6">{message}</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >Cancel</button>
                            <button
                                onClick={onConfirm}
                                className={`px-5 py-2 rounded-xl bg-${color}-500/20 border border-${color}-500/30 text-${color}-400 text-xs font-black uppercase tracking-widest hover:bg-${color}-500/30 transition-all`}
                            >{confirmLabel}</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
