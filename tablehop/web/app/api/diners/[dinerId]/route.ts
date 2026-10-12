import { bookingAPI } from '@/lib/booking-api';

export async function GET(req: Request, { params }: { params: Promise<{ dinerId: string }> }) {
    const { dinerId } = await params;
    const { status, data } = await bookingAPI(`/diners/${dinerId}`);
    return Response.json(data, { status });
}