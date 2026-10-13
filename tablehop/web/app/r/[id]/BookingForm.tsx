'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/use-user';
import { formatTime } from '@/lib/user';
import Confetti from '@/components/Confetti';

type Slot = { time: string; free: number };
type Result = { ok: boolean; text: string; at: number };

export default function BookingForm({ restaurantId, restaurantName }: { restaurantId: string; restaurantName: string }) {
    const user = useUser();
    const [date, setDate] = useState('2024-06-15');
    const [guests, setGuests] = useState(2);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [picked, setPicked] = useState<Slot | null>(null);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<Result | null>(null);

    async function loadSlots() {
        const res = await fetch(`/api/availability?restaurantId=${restaurantId}&date=${date}&guests=${guests}`);
        const data = await res.json();
        setSlots(data.slots ?? []);
    }

    useEffect(() => {
        setPicked(null);
        loadSlots();
    }, [date, guests]);

    async function reserve() {
        if (!picked || !user) return;
        const full = picked.free === 0;
        setSaving(true);
        setResult(null);

        const res = await fetch(full ? '/api/waitlist' : '/api/bookings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ restaurantId, date, time: picked.time, guests, dinerName: user.name }),
        });
        const data = await res.json();

        if (res.ok) {
            setResult({
                at: Date.now(),
                ok: true,
                text: full
                    ? `You’re on the waitlist for ${formatTime(picked.time)}. If a table opens, we’ll offer it to you.`
                    : `You’re booked at ${restaurantName}, ${formatTime(picked.time)} for ${guests}.`,
            });
            setPicked(null);
        } else {
            setResult({ at: Date.now(), ok: false, text: data.error ?? 'That didn’t go through. Try another time.' });
        }
        setSaving(false);
        loadSlots();
    }

    return (
        <aside className="relative h-fit rounded-2xl border border-line p-5 sm:p-6 lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold tracking-tight">Reserve a table</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="text-sm">
                    <span className="text-muted">Date</span>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-ink"
                    />
                </label>
                <label className="text-sm">
                    <span className="text-muted">Party size</span>
                    <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
                    >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                        ))}
                    </select>
                </label>
            </div>

            <p className="mt-6 text-sm text-muted">Pick a time</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
                {slots.map((s, i) => {
                    const selected = picked?.time === s.time;
                    const full = s.free === 0;
                    return (
                        <button
                            key={`${date}-${guests}-${s.time}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                            onClick={() => { setPicked(s); setResult(null); }}
                            aria-pressed={selected}
                            className={[
                                'animate-pop rounded-lg border px-2 py-2.5 text-center tabular-nums transition-colors',
                                selected ? 'border-ink bg-ink text-paper' : full ? 'border-transparent bg-wash' : 'border-line hover:border-ink',
                            ].join(' ')}
                        >
                            <span className="block text-[15px] font-medium">{formatTime(s.time)}</span>
                            <span className={['block text-xs', selected ? 'text-paper/70' : full ? 'text-muted' : 'text-open'].join(' ')}>
                                {full ? 'Waitlist' : `${s.free} open`}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6">
                {user === null || user?.role === 'host' ? (
                    <Link
                        href={`/signin?next=/r/${restaurantId}`}
                        className="block rounded-full bg-ink py-3 text-center font-medium text-paper hover:bg-ink/80"
                    >
                        {user ? 'Switch to a diner to reserve' : 'Sign in to reserve'}
                    </Link>
                ) : (
                    <button
                        onClick={reserve}
                        disabled={!picked || saving || !user}
                        className="w-full rounded-full bg-ink py-3 font-medium text-paper hover:bg-ink/80 disabled:bg-line disabled:text-muted"
                    >
                        {!picked
                            ? 'Choose a time'
                            : picked.free === 0
                                ? `Join waitlist for ${formatTime(picked.time)}`
                                : `Book ${formatTime(picked.time)} for ${guests}`}
                    </button>
                )}
            </div>

            {result?.ok && <Confetti key={result.at} pieces={28} />}
            {result && (
                <p key={result.at} role="status" className={['animate-pop mt-4 rounded-lg px-4 py-3 text-sm', result.ok ? 'bg-open-wash text-open' : 'bg-wash text-alert'].join(' ')}>
                    {result.text}
                    {result.ok && (
                        <> <Link href="/me" className="font-medium underline underline-offset-2">See my reservations</Link></>
                    )}
                </p>
            )}
        </aside>
    );
}
