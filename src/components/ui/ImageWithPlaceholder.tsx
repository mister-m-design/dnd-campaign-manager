"use client";

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithPlaceholderProps extends Omit<ImageProps, 'src' | 'onLoad'> {
    src?: string | null;
    name?: string;
    fallbackIcon?: string;
    containerClassName?: string;
}

const getDeterministicColor = (seed: string) => {
    const colors = [
        'from-slate-700 to-slate-900',
        'from-blue-700 to-blue-900',
        'from-emerald-700 to-emerald-900',
        'from-amber-700 to-amber-900',
        'from-red-700 to-red-900',
        'from-purple-700 to-purple-900',
        'from-cyan-700 to-cyan-900',
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const ImageWithPlaceholder = ({
    src,
    alt,
    name = '',
    fallbackIcon = 'person',
    containerClassName = '',
    className = '',
    ...props
}: ImageWithPlaceholderProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (!src || hasError) {
        return (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getDeterministicColor(name || alt)} border border-white/10 ${containerClassName}`}>
                {name || alt ? (
                    <span className="text-2xl font-black text-white/50 tracking-tighter select-none">{initials}</span>
                ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-500">{fallbackIcon}</span>
                )}
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
            {isLoading && <div className="absolute inset-0 shimmer z-10" />}
            <Image
                src={src}
                alt={alt}
                className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setHasError(true);
                    setIsLoading(false);
                }}
                {...props}
            />
        </div>
    );
};
