import { getUser } from '@/lib/session';
import { cancelAndOffer } from '@/lib/cancel';

export async function POST(req: Request) {
    const { bookingId } = await req.json();

    // hosts can only cancel at their own restaurant. booking ids start with the restaurant id
    const user = await getUser();
    if (user?.role !== 'host' || !String(bookingId).startsWith(`${user.restaurantId}_`)) {
        return Response.json({ error: 'Sign in as this restaurant’s host to cancel.' }, { status: 403 });
    }

    return cancelAndOffer(bookingId);
}
