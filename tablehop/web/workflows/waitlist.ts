import { createHook, sleep } from 'workflow';
import { bookingAPI } from '@/lib/booking-api';
import { generateText } from 'ai';

type Openings = { restaurantId: string; tableId: string; size: number; date: string; time: string; runKey: string };
type Diner = { id: string; dinerName: string; guests: number };

export async function waitlistWorkflow(openings: Openings) {
    'use workflow';

    const waitlist = await getWaitlist(openings);

    for (const diner of waitlist) {
        if (diner.guests > openings.size) continue;

        const message = await offWaitlistMsg(openings, diner);
        const offerStatus = `${openings.runKey}-${diner.id}`;
        const hook = createHook<{ accepted: boolean }>({ token: offerStatus });
        await takeOffWaitlist(diner.id, openings.tableId, offerStatus, message);

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

async function takeOffWaitlist(waitlistId: string, tableId: string, offerStatus: string, message: string) {
    'use step';
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    await bookingAPI(`/confirm-waitlist/${waitlistId}`, 'PATCH', { status: 'offered', tableId, offerStatus, expiresAt, message });
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
}async function offWaitlistMsg(o: Openings, diner: Diner) {
    'use step';
    const { data: restaurant } = await bookingAPI(`/restaurants/${o.restaurantId}`);
    const plain = '${o.time} for ${diner.guests} at ${restaurant.name} is available';

    try {
        const { text } = await generateText({
            model: 'google/gemini-2.5-flash',
            providerOptions: { gateway: { models: ['openai/gpt-4o-mini'] } },
            maxOutputTokens: 300,
            prompt: `Write a short text message under 25 words telling ${diner.dinerName} a table for ${diner.guests} just opened at ${restaurant.name} (${restaurant.cuisine}) at ${o.time}. They have 60 seconds to take it.`,
        });
        return text.trim() || plain;
    } catch {
        return plain;
    }
}


