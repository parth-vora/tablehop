'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { dinerId, formatDate, formatTime, tableLabel } from '@/lib/user';
import { useFresh } from '@/lib/use-fresh';
import { chime, unlockChime } from '@/lib/chime';
import { sfx } from '@/lib/sfx';
import { Toasts, useToasts } from '@/components/Toasts';
import CountdownRing from '@/components/CountdownRing';
import Confetti from '@/components/Confetti';
import PixelIcon from '@/components/PixelIcon';

type Booking = { bookingId: string; restaurantId: string; tableId: string; date: string; time: string; guests: number };
type WaitlistEntry = {
    id: string; restaurantId: string; date: string; time: string; guests: number; status: string;
    expiresAt?: string; offerStatus?: string; message?: string; tableId?: string;
};

const statusText: Record<string, string> = {
    waiting: 'Waiting',
    expired: 'Missed it',
    declined: 'Passed',
    lost: 'Someone else got it',
    booked: 'Booked',
};

function SectionTitle({ id, children, count }: { id: string; children: React.ReactNode; count?: number }) {
    return (
        <div className="flex items-baseline justify-between gap-4 border-b-4 border-line pb-4">
            <h2 id={id} className="font-pixel text-xs">{children}</h2>
            {count !== undefined && <span className="font-pixel text-[9px] text-muted">x{count}</span>}
        </div>
    );
}

export default function MyReservations({ name, restaurantNames }: { name: string; restaurantNames: Record<string, string> }) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [answering, setAnswering] = useState('');
    const [won, setWon] = useState<WaitlistEntry | null>(null);
    const [confirming, setConfirming] = useState('');
    const [leaving, setLeaving] = useState('');
    const [sound, setSound] = useState(false);
    const { toasts, push } = useToasts();
    const fresh = useFresh(loaded);
    const lastStatus = useRef<Record<string, string> | null>(null);

    const place = (id: string) => restaurantNames[id] ?? 'the restaurant';

    async function loadMine() {
        const res = await fetch(`/api/diners/${dinerId(name)}`);
        const data = await res.json();
        const list: WaitlistEntry[] = data.waitlist ?? [];
        setBookings((data.bookings ?? []).sort((a: Booking, b: Booking) => (a.date + a.time).localeCompare(b.date + b.time)));
        setWaitlist(list);
        setLoaded(true);
        react(list);
    }

    // compare with the last poll and react to what changed
    function react(list: WaitlistEntry[]) {
        const before = lastStatus.current;
        lastStatus.current = Object.fromEntries(list.map((w) => [w.id, w.status]));
        if (!before) return;

        for (const w of list) {
            const was = before[w.id];
            if (was === w.status) continue;
            if (w.status === 'offered') {
                chime();
                push(`A table opened at ${place(w.restaurantId)}`, 'good');
            }
            if (was === 'offered' && w.status === 'booked') setWon(w);
            if (was === 'offered' && w.status === 'expired') push('Time ran out on that table. You’re off this waitlist.');
            if (was === 'offered' && w.status === 'lost') push('Someone else got that table first.');
        }
    }

    useEffect(() => {
        loadMine();
        const timer = setInterval(() => {
            loadMine();
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, [name]);

    // put the offer in the tab title so it's noticed from another tab
    const offers = waitlist.filter((w) => w.status === 'offered');
    useEffect(() => {
        document.title = offers.length ? 'A table opened for you' : 'Tablehop';
    }, [offers.length]);

    useEffect(() => {
        if (!won) return;
        const t = setTimeout(() => setWon(null), 7000);
        return () => clearTimeout(t);
    }, [won]);

    async function respond(offerStatus: string, accepted: boolean) {
        sfx(accepted ? 'win' : 'back');
        setAnswering(offerStatus);
        await fetch('/api/offers/respond', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ offerStatus, accepted }),
        });
        await loadMine();
        setAnswering('');
        if (!accepted) push('Passed. The table goes to the next person in line.');
    }

    async function cancelBooking(b: Booking) {
        sfx('back');
        setConfirming('');
        setLeaving(b.bookingId);
        const res = await fetch('/api/bookings/cancel', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ bookingId: b.bookingId }),
        });
        const data = await res.json();
        push(res.ok ? `Cancelled ${place(b.restaurantId)} at ${formatTime(b.time)}. The table goes to the next person on the waitlist.` : data.error ?? 'Couldn’t cancel. Try again.');
        await loadMine();
        setLeaving('');
    }

    function turnOnSound() {
        unlockChime();
        setSound(true);
        setTimeout(chime, 50);
    }

    const waiting = waitlist.filter((w) => w.status !== 'offered' && w.status !== 'booked');

    return (
        <>
            <div className="mt-8">
                {sound ? (
                    <p className="flex items-center gap-3 text-muted">
                        <span className="animate-live size-2 bg-open" /> Sound on. You’ll hear a chime when a table opens.
                    </p>
                ) : (
                    <button onClick={turnOnSound} className="px-btn bg-wash px-4 py-3 font-pixel text-[9px] text-ink">
                        Turn on sound alerts
                    </button>
                )}
            </div>

            {won && (
                <section key={won.id} className="px-panel animate-offer relative mt-12 overflow-visible bg-open p-6 text-void [--frame:var(--color-ink)] sm:p-8">
                    <Confetti />
                    <p className="font-pixel text-[10px]">TABLE SECURED!</p>
                    <p className="mt-3 text-void/75">{place(won.restaurantId)}, {formatDate(won.date)}</p>
                    <p className="mt-2 font-pixel text-lg leading-relaxed sm:text-2xl">
                        It’s yours. {formatTime(won.time)}, party of {won.guests}.
                    </p>
                    <p className="mt-3 text-void/80">You’re booked. It’s under Upcoming below.</p>
                </section>
            )}

            {offers.map((w) => {
                const secondsLeft = Math.max(0, Math.round((Date.parse(w.expiresAt ?? '') - now) / 1000));
                const busy = answering === w.offerStatus;
                return (
                    <section key={w.id} aria-live="assertive" className="px-panel animate-offer mt-12 bg-void [--frame:var(--color-coin)]">
                        <div className="animate-nudge flex flex-col gap-8 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                            <div className="min-w-0">
                                <p className="animate-blink font-pixel text-[10px] text-coin">LAST-MINUTE TABLE!</p>
                                <p className="mt-3 flex items-center gap-3 text-muted">
                                    <span className="animate-live size-2 bg-open" />
                                    A table opened at {place(w.restaurantId)}, {formatDate(w.date)}
                                </p>
                                <p className="mt-4 max-w-xl font-pixel text-base leading-relaxed sm:text-lg">
                                    {w.message ?? `${formatTime(w.time)} for ${w.guests} is yours if you want it.`}
                                </p>
                                {secondsLeft > 0 && w.offerStatus && (
                                    <div className="mt-8 flex flex-wrap gap-5">
                                        <button
                                            onClick={() => respond(w.offerStatus!, true)}
                                            disabled={busy}
                                            className="px-btn bg-open px-6 py-4 font-pixel text-[10px] text-void disabled:opacity-60"
                                        >
                                            {busy ? 'Booking…' : 'Take the table'}
                                        </button>
                                        <button
                                            onClick={() => respond(w.offerStatus!, false)}
                                            disabled={busy}
                                            className="px-btn bg-wash px-6 py-4 font-pixel text-[10px] text-ink disabled:opacity-60"
                                        >
                                            Pass
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="order-first sm:order-none">
                                <CountdownRing seconds={secondsLeft} />
                            </div>
                        </div>
                    </section>
                );
            })}

            <section aria-labelledby="upcoming" className="mt-16">
                <SectionTitle id="upcoming" count={bookings.length}>UPCOMING</SectionTitle>
                <ul className="mt-6 flex flex-col gap-6">
                    {bookings.map((b) => (
                        <li
                            key={b.bookingId}
                            className={[
                                'px-frame grid grid-cols-[5.5rem_1fr] items-center gap-4 bg-wash p-4 transition-opacity duration-300 [--frame:var(--color-line)] sm:grid-cols-[7rem_1fr_auto]',
                                fresh('b' + b.bookingId) ? 'animate-enter [--frame:var(--color-open)]' : '',
                                leaving === b.bookingId ? 'opacity-30' : '',
                            ].join(' ')}
                        >
                            <span className="font-pixel text-xs text-coin">{formatTime(b.time)}</span>
                            <div>
                                <Link href={`/r/${b.restaurantId}`} className="font-medium hover:text-coin hover:underline hover:underline-offset-4">
                                    {place(b.restaurantId)}
                                </Link>
                                <p className="text-muted">
                                    {formatDate(b.date)}, party of {b.guests}
                                </p>
                            </div>
                            <div className="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-3 sm:col-start-auto sm:justify-end">
                                <span className="font-pixel text-[9px] text-muted">{tableLabel(b.tableId)}</span>
                                {confirming === b.bookingId ? (
                                    <span className="animate-pop flex items-center gap-4">
                                        <button onClick={() => cancelBooking(b)} className="px-btn bg-alert px-3 py-2 font-pixel text-[9px] text-ink">
                                            Cancel booking
                                        </button>
                                        <button
                                            onClick={() => {
                                                sfx('blip');
                                                setConfirming('');
                                            }}
                                            className="text-muted hover:text-ink"
                                        >
                                            Keep it
                                        </button>
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            sfx('blip');
                                            setConfirming(b.bookingId);
                                        }}
                                        className="px-btn bg-paper px-3 py-2 font-pixel text-[9px] text-ink"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                {loaded && bookings.length === 0 && (
                    <p className="py-6 text-muted">
                        No bookings yet. <Link href="/" className="text-coin underline underline-offset-4">Find a table</Link>
                    </p>
                )}
            </section>

            {(waiting.length > 0 || offers.length === 0) && (
                <section aria-labelledby="waitlists" className="mt-16">
                    <SectionTitle id="waitlists" count={waiting.length}>WAITLISTS</SectionTitle>
                    <ul className="mt-6 flex flex-col gap-6">
                        {waiting.map((w) => (
                            <li
                                key={w.id}
                                className={[
                                    'px-frame grid grid-cols-[5.5rem_1fr] items-center gap-4 bg-paper p-4 [--frame:var(--color-line)] sm:grid-cols-[7rem_1fr_auto]',
                                    fresh('w' + w.id) ? 'animate-enter' : '',
                                ].join(' ')}
                            >
                                <span className="font-pixel text-xs text-muted">{formatTime(w.time)}</span>
                                <div>
                                    <p className="font-medium">{place(w.restaurantId)}</p>
                                    <p className="text-muted">
                                        {formatDate(w.date)}, party of {w.guests}
                                    </p>
                                </div>
                                <span
                                    key={w.status}
                                    className="px-frame animate-pop col-start-2 flex h-fit w-fit items-center gap-2 bg-wash px-3 py-1 text-sm [--frame:var(--color-line)] sm:col-start-auto"
                                >
                                    {w.status === 'waiting' && <PixelIcon name="hourglass" size={9} className="animate-blink text-coin" />}
                                    {statusText[w.status] ?? w.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {loaded && waiting.length === 0 && (
                        <p className="py-6 text-muted">You’re not on any waitlists. Full times on a restaurant page let you join one.</p>
                    )}
                </section>
            )}

            <Toasts toasts={toasts} />
        </>
    );
}
