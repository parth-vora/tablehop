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
            <p className="font-pixel text-[9px] text-coin">YOUR TABLES</p>
            <h1 className="mt-4 font-pixel text-2xl leading-[1.5] sm:text-3xl">My reservations</h1>
            <p className="mt-3 text-xl text-muted">Signed in as {user.name}</p>
            <MyReservations name={user.name} restaurantNames={names} />
        </div>
    );
}
