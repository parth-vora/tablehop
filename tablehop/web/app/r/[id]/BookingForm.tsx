'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/lib/use-user';
import { formatTime } from '@/lib/user';
import { sfx } from '@/lib/sfx';
import Confetti from '@/components/Confetti';
import PixelIcon from '@/components/PixelIcon';

type Slot = { time: string; free: number };
type Result = { ok: boolean; text: string; at: number };

const MIN_GUESTS = 1;
const MAX_GUESTS = 6;

export default function BookingForm({ restaurantId, restaurantName, presetTime, presetGuests }: {
    restaurantId: string;
    restaurantName: string;
    presetTime?: string;
    presetGuests?: number;
}) {
    const user = useUser();
    const [date, setDate] = useState('2024-06-15');
    const [guests, setGuests] = useState(
        presetGuests ? Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, presetGuests)) : 2,
    );
    const [slots, setSlots] = useState<Slot[]>([]);
    const [picked, setPicked] = useState<Slot | null>(null);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const preset = useRef(presetTime);

    async function loadSlots() {
        const res = await fetch(`/api/availability?restaurantId=${restaurantId}&date=${date}&guests=${guests}`);
        const data = await res.json();
        setSlots(data.slots ?? []);

        if (preset.current) {
            const match = (data.slots ?? []).find((s: Slot) => s.time === preset.current);
            if (match) setPicked(match);
            preset.current = undefined;
        }
    }

    useEffect(() => {
        setPicked(null);
        loadSlots();
    }, [date, guests]);

    function changeGuests(delta: number) {
        const next = Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, guests + delta));
        if (next === guests) return sfx('error');
        sfx('blip');
        setGuests(next);
    }

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
            sfx(full ? 'coin' : 'win');
            setResult({
                at: Date.now(),
                ok: true,
                text: full
                    ? `You’re on the waitlist for ${formatTime(picked.time)}. If a table opens, we’ll offer it to you.`
                    : `You’re booked at ${restaurantName}, ${formatTime(picked.time)} for ${guests}.`,
            });
            setPicked(null);
        } else {
            sfx('error');
            setResult({ at: Date.now(), ok: false, text: data.error ?? 'That didn’t go through. Try another time.' });
        }
        setSaving(false);
        loadSlots();
    }

    return (
        <aside className="px-panel relative h-fit bg-wash p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-4">
                <h2 className="font-pixel text-xs">RESERVE A TABLE</h2>
                <span className="animate-live size-2 bg-open" aria-hidden />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <label className="block">
                    <span className="font-pixel text-[9px] text-muted">DATE</span>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                            sfx('blip');
                            setDate(e.target.value);
                        }}
                        className="px-frame mt-3 block w-full bg-paper px-3 py-2 text-ink outline-none [--frame:var(--color-line)] focus:[--frame:var(--color-coin)]"
                    />
                </label>
                <div role="group" aria-labelledby="party-label">
                    <span id="party-label" className="font-pixel text-[9px] text-muted">PARTY SIZE</span>
                    <div className="px-frame mt-3 flex items-center justify-between bg-paper [--frame:var(--color-line)]">
                        <button
                            type="button"
                            onClick={() => changeGuests(-1)}
                            disabled={guests <= MIN_GUESTS}
                            aria-label="Fewer guests"
                            className="px-3 py-2 font-pixel text-xs text-coin hover:bg-wash disabled:text-line"
                        >
                            -
                        </button>
                        <output aria-live="polite" className="font-pixel text-[11px]">
                            {guests}
                            <span className="sr-only"> {guests === 1 ? 'guest' : 'guests'}</span>
                        </output>
                        <button
                            type="button"
                            onClick={() => changeGuests(1)}
                            disabled={guests >= MAX_GUESTS}
                            aria-label="More guests"
                            className="px-3 py-2 font-pixel text-xs text-coin hover:bg-wash disabled:text-line"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            <div aria-hidden className="mt-4 flex h-5 items-end gap-1.5 text-open">
                {Array.from({ length: guests }, (_, i) => (
                    <PixelIcon key={`${guests}-${i}`} name="person" size={16} className="animate-pop" />
                ))}
            </div>

            <p className="mt-6 font-pixel text-[9px] text-muted">PICK A TIME</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
                {slots.map((s, i) => {
                    const selected = picked?.time === s.time;
                    const full = s.free === 0;
                    return (
                        <button
                            key={`${date}-${guests}-${s.time}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                            onClick={() => {
                                sfx('select');
                                setPicked(s);
                                setResult(null);
                            }}
                            aria-pressed={selected}
                            className={[
                                'px-frame animate-pop px-1 py-2.5 text-center transition-colors',
                                selected
                                    ? 'bg-coin text-void [--frame:var(--color-ink)]'
                                    : full
                                      ? 'bg-paper/60 [--frame:var(--color-line)] hover:[--frame:var(--color-alert)]'
                                      : 'bg-paper [--frame:var(--color-line)] hover:[--frame:var(--color-open)]',
                            ].join(' ')}
                        >
                            <span className="block font-pixel text-[10px]">{formatTime(s.time)}</span>
                            <span
                                className={[
                                    'mt-1 flex items-center justify-center gap-1 text-sm',
                                    selected ? 'text-void/75' : full ? 'text-alert' : 'text-open',
                                ].join(' ')}
                            >
                                {full && <PixelIcon name="hourglass" size={9} />}
                                {full ? 'Waitlist' : `${s.free} open`}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-8">
                {user === null || user?.role === 'host' ? (
                    <Link
                        href={`/signin?next=/r/${restaurantId}`}
                        onClick={() => sfx('select')}
                        className="px-btn block bg-coin py-4 text-center font-pixel text-[10px] text-void"
                    >
                        {user ? 'Switch to a diner to reserve' : 'Sign in to reserve'}
                    </Link>
                ) : (
                    <button
                        onClick={reserve}
                        disabled={!picked || saving || !user}
                        className="px-btn w-full bg-alert px-3 py-4 font-pixel text-[10px] leading-relaxed text-ink disabled:bg-line disabled:text-muted"
                    >
                        {saving
                            ? 'Saving…'
                            : !picked
                              ? 'Choose a time'
                              : picked.free === 0
                                ? `Join waitlist for ${formatTime(picked.time)}`
                                : `Book ${formatTime(picked.time)} for ${guests}`}
                    </button>
                )}
            </div>

            {result?.ok && <Confetti key={'confetti-' + result.at} pieces={28} />}
            {result && (
                <div
                    key={'msg-' + result.at}
                    role="status"
                    className={[
                        'px-frame animate-pop mt-6 px-4 py-3',
                        result.ok ? 'bg-open-wash text-ink [--frame:var(--color-open)]' : 'bg-paper text-alert [--frame:var(--color-alert)]',
                    ].join(' ')}
                >
                    <p className={['font-pixel text-[10px]', result.ok ? 'text-open' : 'text-alert'].join(' ')}>
                        {result.ok ? 'TABLE BOOKED!' : 'NO LUCK THIS TIME'}
                    </p>
                    <p className="mt-2">
                        {result.text}
                        {result.ok && (
                            <>
                                {' '}
                                <Link href="/me" className="text-coin underline underline-offset-4">
                                    See my reservations
                                </Link>
                            </>
                        )}
                    </p>
                </div>
            )}
        </aside>
    );
}