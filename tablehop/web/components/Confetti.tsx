'use client';

import { useMemo } from 'react';

const colors = ['#000000', '#0d7a4a', '#ffffff', '#6b6b6b'];

export default function Confetti({ pieces = 36 }: { pieces?: number }) {
    const bits = useMemo(
        () =>
            Array.from({ length: pieces }, (_, i) => {
                const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.4;
                const dist = 90 + Math.random() * 140;
                return {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist - 60,
                    r: Math.random() * 720 - 360,
                    color: colors[i % colors.length],
                    w: 6 + Math.random() * 6,
                    round: i % 3 === 0,
                };
            }),
        [pieces],
    );

    return (
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-20">
            {bits.map((b, i) => (
                <span
                    key={i}
                    className="animate-confetti absolute block border border-ink/10"
                    style={{
                        width: b.w,
                        height: b.round ? b.w : b.w * 0.45,
                        borderRadius: b.round ? 999 : 1,
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
