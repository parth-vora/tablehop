import { bookingAPI } from '@/lib/booking-api';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const date = new URL(req.url).searchParams.get('date');
    const { status, data } = await bookingAPI(`/restaurants/${id}/day?date=${date}`);
    return Response.json(data, { status });
}