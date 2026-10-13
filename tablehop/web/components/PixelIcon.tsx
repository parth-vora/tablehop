const bitmaps = {
    heart: ['.XX.XX.', 'XXXXXXX', 'XoXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    coin: ['..XXX..', '.XXXXX.', 'XXoXXXX', 'XXoXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..'],
    star: ['...X...', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '.XX.XX.', 'XX...XX'],
    arrow: ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXX..', 'XX...', 'X....'],
    hourglass: ['XXXXX', '.XoX.', '..X..', '.X.X.', 'XXXXX'],
    person: ['..XX..', '..XX..', '.XXXX.', 'X.XX.X', '..XX..', '.X..X.', '.X..X.'],
    bang: ['XX', 'XX', 'XX', 'XX', '..', 'XX'],
    check: ['.....X', '....XX', 'X..XX.', 'XXXX..', '.XX...'],
} as const;

export type PixelIconName = keyof typeof bitmaps;

export default function PixelIcon({
    name,
    size = 14,
    className,
    label,
}: {
    name: PixelIconName;
    size?: number;
    className?: string;
    label?: string;
}) {
    const rows = bitmaps[name];
    const w = rows[0].length;
    const h = rows.length;

    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            height={size}
            width={(size * w) / h}
            shapeRendering="crispEdges"
            className={['inline-block shrink-0', className].filter(Boolean).join(' ')}
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
        >
            {rows.flatMap((row, y) =>
                [...row].map((c, x) =>
                    c === '.' ? null : (
                        <rect
                            key={`${x}-${y}`}
                            x={x}
                            y={y}
                            width={1}
                            height={1}
                            fill={c === 'o' ? 'rgb(255 255 255 / 0.65)' : 'currentColor'}
                        />
                    ),
                ),
            )}
        </svg>
    );
}

export function Hearts({ rating }: { rating?: number }) {
    const score = rating ?? 0;
    const full = Math.round(score);
    return (
        <span className="flex items-center gap-1" role="img" aria-label={`${score.toFixed(1)} rating`}>
            {Array.from({ length: 5 }, (_, i) => (
                <PixelIcon key={i} name="heart" size={12} className={i < full ? 'text-alert' : 'text-line'} />
            ))}
            <span aria-hidden className="ml-1.5 font-pixel text-[9px] text-muted">{score.toFixed(1)}</span>
        </span>
    );
}

export function Coins({ price }: { price?: string }) {
    const n = Math.min(Math.max(price?.length ?? 1, 1), 4);
    return (
        <span className="font-pixel text-[10px] tracking-widest" aria-label={`Price level ${n} of 4`}>
            <span className="text-coin">{'$'.repeat(n)}</span>
            <span className="text-muted/40" aria-hidden="true">{'$'.repeat(4 - n)}</span>
        </span>
    );
}
