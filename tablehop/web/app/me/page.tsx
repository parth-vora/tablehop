'use client';

import { useEffect, useState } from 'react';

type Booking = { bookingId: string; restaurantId: string; tableId: string; date: string; time: string };
type WaitlistEntry = { id: string; restaurantId: string; date: string; time: string; guests: number; status: string; expiresAt?: string; offerStatus?: string; message?: string };

const statusText: Record<string, string> = {
    waiting: 'waiting',
    expired: 'missed it',
    declined: 'passed',
    lost: 'someone else got it',
    booked: 'booked',
}

export default function MyPage() {
    const [name, setName] = useState('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        setName(localStorage.getItem('name') ?? '');
    }, []);

    async function loadMine() {
        if (!name) return;
        const dinerId = name.trim().toLowerCase().replace(/\s+/g, '-');
        const res = await fetch(`/api/diners/${dinerId}`);
        const data = await res.json();
        setBookings(data.bookings ?? []);
        setWaitlist(data.waitlist ?? []);
    }

    useEffect(() => {
        loadMine();
        const timer = setInterval(() => {
            loadMine();
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, [name]);

    async function respond(offerStatus: string, accepted: boolean) {
        await fetch('/api/offers/respond', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ offerStatus, accepted }),
        });
        loadMine();
    }

    return (
        <main>
            <input placeholder="name" value={name} onChange={(e) => {
                setName(e.target.value);
                localStorage.setItem('name', e.target.value);
            }} />

            <h2>a table opened up</h2>
            <ul>
                {waitlist.filter((w) => w.status === 'offered').map((w) => {
                    const secondsLeft = Math.max(0, Math.round((Date.parse(w.expiresAt ?? '') - now) / 1000));
                    return (
                        <li key={w.id}>
                            {w.message ?? `${w.time} for ${w.guests} is yours if you want it`} ({secondsLeft}s left)
                            {secondsLeft > 0 && w.offerStatus && (
                                <>
                                    <button onClick={() => respond(w.offerStatus!, true)}>take it</button>
                                    <button onClick={() => respond(w.offerStatus!, false)}>pass</button>
                                </>
                            )}
                        </li>
                    );
                })}
            </ul>

            <h2>bookings</h2>
            <ul>
                {bookings.map((b) => (
                    <li key={b.bookingId}>{b.date} {b.time} {b.tableId}</li>
                ))}
            </ul>

            <h2>waitlist</h2>
            <ul>
                {waitlist.filter((w) => w.status !== 'offered').map((w) => (
                    <li key={w.id}>{w.date} {w.time} {statusText[w.status] ?? w.status}</li>
                ))}
            </ul>
        </main>
    );
}