import { createHook, sleep } from 'workflow';
import { bookingAPI } from '@/lib/booking-api';

type Openings = { restaurantId: string; tableId: string; size: number; date: string; time: string; runKey: string };
type Diner = { id: string; dinerName: string; guests: number };

export async function waitlistWorkflow(openings: Openings) {
    'use workflow';

    const waitlist = await getWaitlist(openings);

    for (const diner of waitlist) {
        if (diner.guests > openings.size) continue;

        // listen first, then send the offer, so a fast reply isn't missed
        const offerStatus = `${openings.runKey}-${diner.id}`;
        const hook = createHook<{ accepted: boolean }>({ token: offerStatus });
        await takeOffWaitlist(diner.id, openings.tableId, offerStatus);

        const answer = await Promise.race([
            hook.then((reply) => reply),
            sleep('60s').then(() => 'timeout' as const),
        ]);

        if (answer === 'timeout') {
            await setStatus(diner.id, 'expired');
            continue;
        }
        if (!answer.accepted) {
            await setStatus(diner.id, 'declined');
            continue;
        }

        const booked = await book(openings, diner);
        if (!booked) await setStatus(diner.id, 'lost');
        return booked ? 'booked' : 'taken';
    }

    return 'no one accepted';
}

async function getWaitlist(o: Openings): Promise<Diner[]> {
    'use step';
    const { data } = await bookingAPI(`/waitlist/${o.restaurantId}?date=${o.date}&time=${o.time}`);
    return data.waitlist;
}

async function takeOffWaitlist(waitlistId: string, tableId: string, offerStatus: string) {
    'use step';
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    await bookingAPI(`/confirm-waitlist/${waitlistId}`, 'PATCH', { status: 'offered', tableId, offerStatus, expiresAt });
}

async function setStatus(waitlistId: string, status: string) {
    'use step';
    await bookingAPI(`/confirm-waitlist/${waitlistId}`, 'PATCH', { status });
}

async function book(o: Openings, diner: Diner) {
    'use step';
    const { status } = await bookingAPI('/bookings', 'POST', {
        restaurantId: o.restaurantId,
        tableId: o.tableId,
        date: o.date,
        time: o.time,
        guests: diner.guests,
        dinerName: diner.dinerName,
    });
    return status === 200 || status === 201;
}