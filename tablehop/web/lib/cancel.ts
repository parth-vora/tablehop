import { start } from 'workflow/api';
import { bookingAPI } from '@/lib/booking-api';
import { waitlistWorkflow } from '@/workflows/waitlist';

// cancel on GCP, then start the waitlist workflow for the table that just opened.
// used by both the host and the diner cancel routes.
export async function cancelAndOffer(bookingId: string) {
    const { status, data } = await bookingAPI('/bookings/cancel', 'POST', { bookingId });
    if (status !== 200) return Response.json(data, { status });

    const run = await start(waitlistWorkflow, [{ ...data, runKey: Date.now().toString(36) }]);
    return Response.json({ ...data, runId: run.runId });
}
