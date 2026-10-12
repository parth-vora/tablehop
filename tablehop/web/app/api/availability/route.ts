import { bookingAPI } from '@/lib/booking-api';

export async function GET(req: Request) {
    const params = new URL(req.url).searchParams;
    const restaurantId = params.get('restaurantId');
    const date = params.get('date');
    const guests = params.get('guests');

    const { status, data } = await bookingAPI(
        `/restaurants/${restaurantId}/availability?date=${date}&guests=${guests}`
    );
    return Response.json(data, { status });
}