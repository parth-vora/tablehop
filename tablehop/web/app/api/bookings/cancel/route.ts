import { bookingAPI } from '@/lib/booking-api';
import { getUser } from '@/lib/session';
import { cancelAndOffer } from '@/lib/cancel';
import { dinerId } from '@/lib/user';

// a diner cancelling their own booking. the freed table goes to the waitlist too.
export async function POST(req: Request) {
    const { bookingId } = await req.json();

    const user = await getUser();
    if (user?.role !== 'diner') return Response.json({ error: 'Sign in to cancel.' }, { status: 401 });

    // check the booking is theirs before touching it
    const { data } = await bookingAPI(`/diners/${dinerId(user.name)}`);
    const mine = (data.bookings ?? []).some((b: { bookingId: string }) => b.bookingId === bookingId);
    if (!mine) return Response.json({ error: 'That booking isn’t yours.' }, { status: 403 });

    return cancelAndOffer(bookingId);
}
