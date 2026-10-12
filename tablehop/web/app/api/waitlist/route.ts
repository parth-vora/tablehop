import { bookingAPI } from '@/lib/booking-api';

export async function POST(req: Request) {
    const { status, data } = await bookingAPI('/waitlist', 'POST', await req.json());
    return Response.json(data, { status });
}