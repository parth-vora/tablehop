'use client';

import { useEffect, useState } from 'react';
type Slot = { time: string; free: number };

export default function BookingForm({ restaurantId }: { restaurantId: string }) {
    const [date, setDate] = useState('2024-06-15');
    const [guests, setGuests] = useState(2);
    const [name, setName] = useState('');
    const [slots, setSlots] = useState<Slot[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        setName(localStorage.getItem('name') ?? '');
    }, []);

    async function loadSlots() {
        const res = await fetch(`/api/availability?restaurantId=${restaurantId}&date=${date}&guests=${guests}`);
        const data = await res.json();
        setSlots(data.slots ?? []);
    }

    useEffect(() => {
        loadSlots();
    }, [date, guests]);

    async function reserve(time: string, full: boolean) {
        if (!name) {
            setMessage('name required');
            return;
        }
        localStorage.setItem('name', name);

        const res = await fetch(full ? '/api/waitlist' : '/api/bookings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ restaurantId, date, time, guests, dinerName: name }),
        });
        const data = await res.json();

        if (!res.ok) setMessage(data.error ?? 'error');
        else if (full) setMessage(`waitlisted ${time}`);
        else setMessage(`booked ${time}`);

        loadSlots();
    }

    return (
        <div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="number" min={1} max={10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
            <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />

            <div>
                {slots.map((s) => (
                    <button key={s.time} onClick={() => reserve(s.time, s.free === 0)}>
                        {s.time} {s.free > 0 ? 'book' : 'waitlist'}
                    </button>
                ))}
            </div>

            {message && <p>{message}</p>}
        </div>
    );
}