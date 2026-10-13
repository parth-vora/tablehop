'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTime, tableLabel } from '@/lib/user';
import { useFresh } from '@/lib/use-fresh';
import { sfx } from '@/lib/sfx';
import { Toasts, useToasts } from '@/components/Toasts';
import PixelIcon from '@/components/PixelIcon';

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

function Score({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className="px-frame bg-void px-4 py-3 [--frame:var(--color-line)]">
            <span className="block font-pixel text-[8px] text-ink/60">{label}</span>
            <span key={value} className={`animate-pop mt-2 block font-pixel text-lg ${tone}`}>
                {String(value).padStart(2, '0')}
            </span>
        </div>
    );
}

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
        sfx('back');
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
            <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
                <label className="block">
                    <span className="font-pixel text-[9px] text-muted">SERVICE DATE</span>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                            sfx('blip');
                            setDate(e.target.value);
                        }}
                        className="px-frame mt-3 block bg-paper px-3 py-2 text-ink outline-none [--frame:var(--color-line)] focus:[--frame:var(--color-coin)]"
                    />
                </label>
                <div className="flex gap-4" aria-live="polite">
                    <Score label="BOOKED" value={bookings.length} tone="text-coin" />
                    <Score label="WAITING" value={waitingCount} tone="text-open" />
                </div>
            </div>

            <section aria-labelledby="floor" className="mt-10">
                <div className="flex items-center justify-between border-b-4 border-line pb-4">
                    <h2 id="floor" className="font-pixel text-xs">FLOOR MAP</h2>
                    <span className="flex items-center gap-2 font-pixel text-[9px] text-open">
                        <span className="animate-live size-2 bg-open" /> LIVE
                    </span>
                </div>
                <div className="overflow-x-auto pb-2">
                    <table className="mt-4 w-max min-w-full border-separate border-spacing-2 text-left">
                        <thead>
                            <tr>
                                <th><span className="sr-only">Table</span></th>
                                {times.map((t) => (
                                    <th key={t} scope="col" className="min-w-32 px-2 pb-1 font-pixel text-[9px] font-normal text-coin">
                                        {formatTime(t)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tables.map((table) => (
                                <tr key={table.id}>
                                    <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-paper pr-3 align-top font-normal">
                                        <span className="block font-pixel text-[10px]">{tableLabel(table.id)}</span>
                                        <span className="mt-1 flex gap-0.5 text-muted" aria-label={`${table.size} seats`}>
                                            {Array.from({ length: table.size }, (_, i) => (
                                                <PixelIcon key={i} name="person" size={10} />
                                            ))}
                                        </span>
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
                                                <td
                                                    key={cellKey}
                                                    className={`px-frame h-24 bg-coin p-2.5 align-top text-void transition-opacity duration-300 [--frame:var(--color-void)] ${going ? 'opacity-30' : ''} ${flip}`}
                                                >
                                                    <span className="block font-medium leading-tight">{b.dinerName}</span>
                                                    <span className="block text-sm text-void/70">Party of {b.guests}</span>
                                                    {confirming === b.bookingId ? (
                                                        <span className="animate-pop mt-2 flex items-center gap-2 text-sm">
                                                            <button onClick={() => cancelBooking(b)} className="bg-alert px-2 py-0.5 font-medium text-ink">
                                                                Cancel it
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    sfx('blip');
                                                                    setConfirming('');
                                                                }}
                                                                className="underline underline-offset-2"
                                                            >
                                                                Keep
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                sfx('blip');
                                                                setConfirming(b.bookingId);
                                                            }}
                                                            className="mt-2 text-sm text-void/75 underline underline-offset-2 hover:text-void"
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
                                                <td key={cellKey} className="px-frame animate-hold h-24 bg-open-wash p-2.5 align-top text-open [--frame:var(--color-open)]">
                                                    <div className={flip}>
                                                        <span className="block font-medium leading-tight">Holding for {offer.dinerName}</span>
                                                        <span className="mt-1 block font-pixel text-[10px]">{s}s to answer</span>
                                                        <span aria-hidden className="mt-2 flex gap-0.5">
                                                            {Array.from({ length: 10 }, (_, i) => (
                                                                <span key={i} className={['h-2 flex-1', i < Math.ceil((s / 60) * 10) ? 'bg-open' : 'bg-open/15'].join(' ')} />
                                                            ))}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td
                                                key={cellKey}
                                                className={`px-frame h-24 bg-wash p-2.5 align-top font-pixel text-[9px] text-muted [--frame:var(--color-line)] ${flip}`}
                                            >
                                                Open
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section aria-labelledby="line" className="mt-14">
                <h2 id="line" className="border-b-4 border-line pb-4 font-pixel text-xs">WAITLIST</h2>
                <ol className="mt-6 flex flex-col gap-4">
                    {waitlist.map((w, i) => (
                        <li
                            key={w.id}
                            className={[
                                'px-frame grid grid-cols-[2.5rem_5.5rem_1fr] items-center gap-4 p-4 transition-colors duration-500 sm:grid-cols-[2.5rem_6.5rem_1fr_auto]',
                                w.status === 'offered' ? 'bg-open-wash [--frame:var(--color-open)]' : 'bg-wash [--frame:var(--color-line)]',
                                fresh('w' + w.id) ? 'animate-enter' : '',
                            ].join(' ')}
                        >
                            <span className="font-pixel text-[10px] text-muted">{i + 1}P</span>
                            <span className="font-pixel text-[10px] text-coin">{formatTime(w.time)}</span>
                            <span>
                                <span className="font-medium">{w.dinerName}</span>
                                <span className="text-muted">, party of {w.guests}</span>
                            </span>
                            <span
                                key={w.status}
                                className={[
                                    'px-frame animate-pop col-start-3 w-fit px-3 py-1 text-sm sm:col-start-auto',
                                    w.status === 'offered' || w.status === 'booked'
                                        ? 'bg-paper text-open [--frame:var(--color-open)]'
                                        : 'bg-paper [--frame:var(--color-line)]',
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
