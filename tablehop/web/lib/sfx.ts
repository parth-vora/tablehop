'use client';

import { useSyncExternalStore } from 'react';

export type Sfx = 'blip' | 'select' | 'coin' | 'win' | 'error' | 'back';

const tunes: Record<Sfx, [freq: number, length: number][]> = {
    blip: [[880, 0.05]],
    select: [[660, 0.05], [990, 0.07]],
    coin: [[988, 0.07], [1319, 0.22]],
    win: [[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.28]],
    error: [[220, 0.1], [165, 0.18]],
    back: [[523, 0.05], [392, 0.08]],
};

const KEY = 'tablehop:sfx';
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;

export function sfxEnabled() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(KEY) !== 'off';
}

export function setSfxEnabled(on: boolean) {
    localStorage.setItem(KEY, on ? 'on' : 'off');
    listeners.forEach((l) => l());
    if (on) sfx('select');
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useSfxEnabled() {
    return useSyncExternalStore(subscribe, sfxEnabled, () => false);
}

// square-wave bleeps, only ever triggered from a user gesture so autoplay rules allow them
export function sfx(kind: Sfx) {
    if (!sfxEnabled()) return;
    try {
        ctx ??= new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        let t = ctx.currentTime;
        for (const [freq, length] of tunes[kind]) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + length);
            t += length * 0.9;
        }
    } catch {
        // no audio available
    }
}
