'use client';

import { useCallback, useState } from 'react';

type Toast = { id: number; text: string; tone: 'plain' | 'good' };

export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const push = useCallback((text: string, tone: Toast['tone'] = 'plain') => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t.slice(-3), { id, text, tone }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
    }, []);

    return { toasts, push };
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
    return (
        <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={[
                        'animate-toast flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-[0_8px_30px_rgb(0_0_0/0.18)]',
                        t.tone === 'good' ? 'bg-open text-paper' : 'bg-ink text-paper',
                    ].join(' ')}
                >
                    {t.text}
                </div>
            ))}
        </div>
    );
}
