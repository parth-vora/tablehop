'use client';

import Link from 'next/link';
import { sfx } from '@/lib/sfx';
import PixelIcon, { Coins, Hearts } from './PixelIcon';

type Restaurant = {
    id: string;
    name: string;
    neighborhood: string;
    cuisine: string;
    priceRange: string;
    rating: number;
    description: string;
};

export default function StageCard({ restaurant: r, index }: { restaurant: Restaurant; index: number }) {
    return (
        <Link
            href={`/r/${r.id}`}
            onClick={() => sfx('select')}
            style={{ animationDelay: `${index * 60}ms` }}
            className="group px-panel animate-enter flex h-full flex-col bg-wash p-5 transition-transform duration-100 hover:-translate-y-1 hover:[--frame:var(--color-coin)] focus-visible:[--frame:var(--color-coin)]"
        >
            <div className="flex items-center justify-between gap-4">
                <span className="font-pixel text-[9px] uppercase text-coin">{r.cuisine}</span>
                <Coins price={r.priceRange} />
            </div>

            <h3 className="mt-4 font-pixel text-sm leading-relaxed text-pretty">{r.name}</h3>
            <p className="mt-1 text-muted">
                {r.neighborhood}
            </p>
            <p className="mt-3 line-clamp-3 leading-relaxed">{r.description}</p>

            <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                <Hearts rating={r.rating} />
                <span className="flex items-center gap-2 font-pixel text-[9px] text-muted group-hover:text-open">
                    BOOK
                    <PixelIcon name="arrow" size={9} className="group-hover:animate-blink" />
                </span>
            </div>
        </Link>
    );
}
