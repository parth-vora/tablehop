import { agentBookingFlag } from '@/lib/flags';

export async function GET() {
    return Response.json({ agentBooking: await agentBookingFlag() });
}