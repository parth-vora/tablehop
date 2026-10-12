'use client';

import { useEffect, useState } from 'react';

type Booking = { bookingId: string; tableId: string; time: string; dinerName: string; guests: number };
type WaitlistEntry = { id: string; time: string; dinerName: string; guests: number; status: string };

export default function HostView({ restaurantId }: { restaurantId: string }) {
    const [date, setDate] = useState('2024-06-15');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [message, setMessage] = useState('');

    async function loadDay() {
        const res = await fetch(`/api/host/${restaurantId}?date=${date}`);
        const data = await res.json();
        setBookings((data.bookings ?? []).sort((a: Booking, b: Booking) => a.time.localeCompare(b.time)));
        setWaitlist(data.waitlist ?? []);
    }

    useEffect(() => {
        loadDay();
        const timer = setInterval(loadDay, 2000);
        return () => clearInterval(timer);
    }, [date]);

    async function cancelBooking(bookingId: string) {
        const res = await fetch('/api/host/cancel', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ bookingId }),
        });
        const data = await res.json();
        setMessage(res.ok ? `cancelled ${data.tableId} at ${data.time}` : data.error ?? 'error');
        loadDay();
    }

    return (
        <div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            {message && <p>{message}</p>}

            <h2>bookings</h2>
            <ul>
                {bookings.map((b) => (
                    <li key={b.bookingId}>
                        {b.time} {b.tableId} {b.dinerName} ({b.guests})
                        <button onClick={() => cancelBooking(b.bookingId)}>cancel</button>
                    </li>
                ))}
            </ul>

            <h2>waitlist</h2>
            <ul>
                {waitlist.map((w) => (
                    <li key={w.id}>
                        {w.time} {w.dinerName} ({w.guests}) {w.status}
                    </li>
                ))}
            </ul>
        </div>
    );
}