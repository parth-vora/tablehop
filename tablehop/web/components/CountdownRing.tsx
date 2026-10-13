
export default function CountdownRing({ seconds, total = 60 }: { seconds: number; total?: number }) {
    const r = 54;
    const length = 2 * Math.PI * r;
    const left = Math.max(0, Math.min(1, seconds / total));
    const urgent = seconds <= 10;

    return (
        <div className="relative size-36 shrink-0 sm:size-40">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="6" />
                <circle
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke={urgent ? '#ff5a5f' : '#2bd17e'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={length}
                    strokeDashoffset={length * (1 - left)}
                    className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                    <span key={seconds} className={['block text-5xl font-semibold tracking-[-0.04em] tabular-nums', urgent ? 'animate-pop' : ''].join(' ')}>
                        {seconds}
                    </span>
                    <span className="block text-xs text-paper/60">seconds</span>
                </div>
            </div>
        </div>
    );
}
