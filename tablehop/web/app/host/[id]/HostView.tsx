'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTime, tableLabel } from '@/lib/user';
import { useFresh } from '@/lib/use-fresh';
import { Toasts, useToasts } from '@/components/Toasts';

type Table = { id: string; size: number };
type Booking = { bookingId: string; tableId: string; time: string; dinerName: string; guests: number };
type WaitlistEntry = {
    id: string; time: string; dinerName: string; guests: number; status: string;
    tableId?: string; expiresAt?: string; createdAt: string;
};

const statusText: Record<string, string> = {
    waiting: 'Waiting',
    offered: 'Offer sent',
    expired: 'No reply',
    declined: 'Passed',
    lost: 'Missed out',
    booked: 'Booked',
};

export default function HostView({ restaurantId }: { restaurantId: string }) {
    const [date, setDate] = useState('2024-06-15');
    const [tables, setTables] = useState<Table[]>([]);
    const [times, setTimes] = useState<string[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [confirming, setConfirming] = useState('');
    const [leaving, setLeaving] = useState('');
    const [now, setNow] = useState(Date.now());
    const { toasts, push } = useToasts();
    const fresh = useFresh(loaded);
    const last = useRef<{ bookings: Set<string>; status: Record<string, string> } | null>(null);

    async function loadDay() {
        const res = await fetch(`/api/host/${restaurantId}?date=${date}`);
        const data = await res.json();
        const b: Booking[] = data.bookings ?? [];
        const w: WaitlistEntry[] = data.waitlist ?? [];
        setTables(data.restaurant?.tables ?? []);
        setTimes(data.restaurant?.timeSlots ?? []);
        setBookings(b);
        setWaitlist(w);
        setLoaded(true);
        react(b, w);
    }

    // compare with the last poll and announce what the workflow just did
    function react(b: Booking[], w: WaitlistEntry[]) {
        const before = last.current;
        last.current = { bookings: new Set(b.map((x) => x.bookingId)), status: Object.fromEntries(w.map((x) => [x.id, x.status])) };
        if (!before) return;

        for (const x of w) {
            const was = before.status[x.id];
            if (was === x.status) continue;
            const who = x.dinerName.split(' ')[0];
            if (!was) push(`${x.dinerName} joined the ${formatTime(x.time)} waitlist`);
            else if (x.status === 'offered') push(`Offer sent to ${x.dinerName}. ${who} has 60 seconds.`);
            else if (x.status === 'booked') push(`${x.dinerName} took the table at ${formatTime(x.time)}`, 'good');
            else if (x.status === 'declined') push(`${who} passed. Offering it to the next person.`);
            else if (x.status === 'expired') push(`No reply from ${who}. Offering it to the next person.`);
            else if (x.status === 'lost') push(`${who} was too late for that table.`);
        }
        for (const x of b) {
            const fromWaitlist = w.some((e) => e.dinerName === x.dinerName && e.status === 'booked');
            if (!before.bookings.has(x.bookingId) && !fromWaitlist) push(`New booking: ${x.dinerName}, ${formatTime(x.time)}`, 'good');
        }
    }

    useEffect(() => {
        last.current = null;
        loadDay();
        const timer = setInterval(loadDay, 2000);
        return () => clearInterval(timer);
    }, [date]);

    useEffect(() => {
        const tick = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(tick);
    }, []);

    async function cancelBooking(b: Booking) {
        setConfirming('');
        setLeaving(b.bookingId);
        const res = await fetch('/api/host/cancel', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ bookingId: b.bookingId }),
        });
        const data = await res.json();
        push(
            res.ok
                ? `Cancelled ${b.dinerName} at ${formatTime(b.time)}. Checking the waitlist…`
                : data.error ?? 'Couldn’t cancel that booking. Refresh and try again.',
        );
        await loadDay();
        setLeaving('');
    }

    const bookingAt = (tableId: string, time: string) => bookings.find((b) => b.tableId === tableId && b.time === time);
    const offerAt = (tableId: string, time: string) =>
        waitlist.find((w) => w.status === 'offered' && w.tableId === tableId && w.time === time);
    const secondsLeft = (w: WaitlistEntry) => Math.max(0, Math.round((Date.parse(w.expiresAt ?? '') - now) / 1000));
    const waitingCount = waitlist.filter((w) => w.status === 'waiting' || w.status === 'offered').length;

    return (
        <>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <label className="text-sm">
                    <span className="text-muted">Service date</span>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block rounded-lg border border-line px-3 py-2 outline-none focus:border-ink"
                    />
                </label>
                <p className="text-sm text-muted tabular-nums">
                    <span key={'b' + bookings.length} className="inline-block animate-pop font-medium text-ink">{bookings.length}</span> booked,{' '}
                    <span key={'w' + waitingCount} className="inline-block animate-pop font-medium text-ink">{waitingCount}</span> waiting
                </p>
            </div>

            <section aria-labelledby="floor" className="mt-10">
                <div className="flex items-center justify-between border-b border-ink pb-3">
                    <h2 id="floor" className="text-sm font-medium">Floor</h2>
                    <span className="flex items-center gap-2 text-sm text-muted">
                        <span className="animate-live size-2 rounded-full bg-open" /> Live
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="mt-4 w-max min-w-full border-separate border-spacing-1.5 text-left text-sm">
                        <thead>
                            <tr>
                                <th className="font-normal text-muted"><span className="sr-only">Table</span></th>
                                {times.map((t) => (
                                    <th key={t} scope="col" className="min-w-28 px-2 pb-1 font-medium tabular-nums">{formatTime(t)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tables.map((table) => (
                                <tr key={table.id}>
                                    <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-paper pr-3 align-top font-normal">
                                        <span className="block font-medium">{tableLabel(table.id)}</span>
                                        <span className="text-muted">{table.size} seats</span>
                                    </th>
                                    {times.map((t) => {
                                        const b = bookingAt(table.id, t);
                                        const offer = offerAt(table.id, t);
                                        const state = b ? 'b' + b.bookingId : offer ? 'o' + offer.id : 'open';
                                        const cellKey = `${table.id}-${t}-${state}`;
                                        const flip = fresh(cellKey) ? 'animate-flip' : '';

                                        if (b) {
                                            const going = leaving === b.bookingId;
                                            return (
                                                <td key={cellKey} className={`h-24 rounded-lg bg-ink p-2.5 align-top text-paper transition-opacity duration-300 ${going ? 'opacity-30' : ''} ${flip}`}>
                                                    <span className="block font-medium leading-tight">{b.dinerName}</span>
                                                    <span className="block text-paper/60">Party of {b.guests}</span>
                                                    {confirming === b.bookingId ? (
                                                        <span className="animate-pop mt-2 flex gap-2 text-xs">
                                                            <button onClick={() => cancelBooking(b)} className="rounded-full bg-paper px-2.5 py-1 font-medium text-ink">
                                                                Cancel it
                                                            </button>
                                                            <button onClick={() => setConfirming('')} className="text-paper/70 underline underline-offset-2">
                                                                Keep
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirming(b.bookingId)}
                                                            className="mt-2 text-xs text-paper/70 underline underline-offset-2 hover:text-paper"
                                                        >
                                                            Cancel booking
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        }

                                        if (offer) {
                                            const s = secondsLeft(offer);
                                            return (
                                                <td key={cellKey} className="animate-hold h-24 rounded-lg border-2 border-open bg-open-wash p-2.5 align-top text-open">
                                                    <div className={flip}>
                                                        <span className="block font-medium leading-tight">Holding for {offer.dinerName}</span>
                                                        <span className="block tabular-nums">{s}s to answer</span>
                                                        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-open/15">
                                                            <span className="block h-full bg-open transition-[width] duration-1000 ease-linear" style={{ width: `${(s / 60) * 100}%` }} />
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={cellKey} className={`h-24 rounded-lg bg-wash p-2.5 align-top text-muted ${flip}`}>Open</td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section aria-labelledby="line" className="mt-14">
                <h2 id="line" className="border-b border-ink pb-3 text-sm font-medium">Waitlist</h2>
                <ol>
                    {waitlist.map((w) => (
                        <li
                            key={w.id}
                            className={[
                                'grid grid-cols-[5.5rem_1fr_auto] items-center gap-4 border-b border-line py-4 transition-colors duration-500',
                                w.status === 'offered' ? 'bg-open-wash/60' : '',
                                fresh('w' + w.id) ? 'animate-enter' : '',
                            ].join(' ')}
                        >
                            <span className="font-semibold tabular-nums">{formatTime(w.time)}</span>
                            <span>
                                <span className="font-medium">{w.dinerName}</span>
                                <span className="text-muted">, party of {w.guests}</span>
                            </span>
                            <span
                                key={w.status}
                                className={[
                                    'animate-pop rounded-full px-3 py-1 text-sm',
                                    w.status === 'offered' || w.status === 'booked' ? 'bg-open-wash text-open' : 'bg-wash',
                                ].join(' ')}
                            >
                                {statusText[w.status] ?? w.status}
                            </span>
                        </li>
                    ))}
                </ol>
                {loaded && waitlist.length === 0 && <p className="py-6 text-muted">No one is waiting for this date.</p>}
            </section>

            <Toasts toasts={toasts} />
        </>
    );
}
