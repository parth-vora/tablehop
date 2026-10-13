// two soft notes when an offer arrives. browsers block sound until the
// page has been clicked once, so this quietly does nothing before that.
let ctx: AudioContext | null = null;

export function chime() {
    try {
        ctx ??= new AudioContext();
        if (ctx.state !== 'running') return;
        [660, 880].forEach((freq, i) => {
            const osc = ctx!.createOscillator();
            const gain = ctx!.createGain();
            const start = ctx!.currentTime + i * 0.14;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
            osc.connect(gain).connect(ctx!.destination);
            osc.start(start);
            osc.stop(start + 0.45);
        });
    } catch {
        // no audio, no problem
    }
}

// call from any click so later chimes are allowed to play
export function unlockChime() {
    try {
        ctx ??= new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
    } catch {}
}
