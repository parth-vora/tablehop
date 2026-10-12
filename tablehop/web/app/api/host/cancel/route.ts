import { start } from 'workflow/api';
import { bookingAPI } from '@/lib/booking-api';
import { waitlistWorkflow } from '@/workflows/waitlist';

export async function POST(req: Request) {
    const { bookingId } = await req.json();
    const { status, data } = await bookingAPI('/bookings/cancel', 'POST', { bookingId });
    if (status !== 200) return Response.json(data, { status });

    const run = await start(waitlistWorkflow, [{ ...data, runKey: Date.now().toString(36) }]);
    return Response.json({ ...data, runId: run.runId });
}