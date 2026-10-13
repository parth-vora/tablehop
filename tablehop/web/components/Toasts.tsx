'use client';

import { useCallback, useState } from 'react';
import PixelIcon from './PixelIcon';

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
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-end gap-4 sm:inset-x-auto sm:right-6"
        >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={[
                        'px-panel animate-toast flex max-w-sm items-start gap-3 px-4 py-3',
                        t.tone === 'good' ? 'bg-open text-void' : 'bg-wash text-ink [--frame:var(--color-coin)]',
                    ].join(' ')}
                >
                    <PixelIcon
                        name={t.tone === 'good' ? 'check' : 'bang'}
                        size={12}
                        className={['mt-1.5', t.tone === 'good' ? 'text-void' : 'text-coin'].join(' ')}
                    />
                    {t.text}
                </div>
            ))}
        </div>
    );
}
