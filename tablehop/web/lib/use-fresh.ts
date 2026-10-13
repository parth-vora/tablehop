'use client';

import { useEffect, useRef } from 'react';

// tells you if a row (by key) showed up after the first load, so only
// new things animate in. the answer for a key never changes, so nothing replays.
export function useFresh(loaded: boolean) {
    const born = useRef(new Map<string, boolean>());
    const armed = useRef(false);

    useEffect(() => {
        if (loaded) armed.current = true;
    }, [loaded]);

    return (key: string) => {
        if (!born.current.has(key)) born.current.set(key, armed.current);
        return born.current.get(key)!;
    };
}
