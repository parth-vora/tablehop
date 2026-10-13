import { redirect } from 'next/navigation';
import { bookingAPI } from '@/lib/booking-api';
import { getUser } from '@/lib/session';
import MyReservations from './MyReservations';

export default async function MyPage() {
    const user = await getUser();
    if (user?.role !== 'diner') redirect('/signin?next=/me');

    // id -> name, so the list can show restaurant names
    const { data } = await bookingAPI('/restaurants', 'GET', undefined, 60);
    const names: Record<string, string> = {};
    for (const r of Array.isArray(data) ? data : []) names[r.id] = r.name;

    return (
        <div className="py-12 sm:py-16">
            <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">My reservations</h1>
            <p className="mt-3 text-lg text-muted">Signed in as {user.name}</p>
            <MyReservations name={user.name} restaurantNames={names} />
        </div>
    );
}
