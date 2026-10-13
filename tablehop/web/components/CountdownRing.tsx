const SEGMENTS = 12;

export default function CountdownRing({ seconds, total = 60 }: { seconds: number; total?: number }) {
    const left = Math.max(0, Math.min(1, seconds / total));
    const lit = Math.ceil(left * SEGMENTS);
    const urgent = seconds <= 10;

    return (
        <div
            role="timer"
            aria-label={`${seconds} seconds left`}
            className={[
                'px-frame grid w-40 shrink-0 place-items-center gap-3 bg-void px-4 py-5',
                urgent ? '[--frame:var(--color-alert)]' : '[--frame:var(--color-open)]',
            ].join(' ')}
        >
            <span className="font-pixel text-[9px] text-ink/60">TIME</span>
            <span
                key={seconds}
                className={['font-pixel text-4xl', urgent ? 'animate-shake text-alert' : 'text-coin'].join(' ')}
            >
                {String(seconds).padStart(2, '0')}
            </span>
            <span aria-hidden className="flex gap-1">
                {Array.from({ length: SEGMENTS }, (_, i) => (
                    <span
                        key={i}
                        className={['h-3 w-1.5', i < lit ? (urgent ? 'bg-alert' : 'bg-open') : 'bg-ink/15'].join(' ')}
                    />
                ))}
            </span>
        </div>
    );
}
