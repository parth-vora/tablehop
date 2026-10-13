'use client';

import { useMemo } from 'react';

const colors = ['#ffcc4d', '#5ee07a', '#ff6a55', '#fff4dc'];

export default function Confetti({ pieces = 36 }: { pieces?: number }) {
    const bits = useMemo(
        () =>
            Array.from({ length: pieces }, (_, i) => {
                const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.4;
                const dist = 90 + Math.random() * 140;
                return {
                    x: Math.round((Math.cos(angle) * dist) / 4) * 4,
                    y: Math.round((Math.sin(angle) * dist - 60) / 4) * 4,
                    r: Math.round(Math.random() * 4) * 90,
                    color: colors[i % colors.length],
                    size: i % 3 === 0 ? 8 : 4,
                };
            }),
        [pieces],
    );

    return (
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-20">
            {bits.map((b, i) => (
                <span
                    key={i}
                    className="animate-confetti absolute block"
                    style={{
                        width: b.size,
                        height: b.size,
                        background: b.color,
                        ['--x' as string]: `${b.x}px`,
                        ['--y' as string]: `${b.y}px`,
                        ['--r' as string]: `${b.r}deg`,
                    }}
                />
            ))}
        </div>
    );
}
