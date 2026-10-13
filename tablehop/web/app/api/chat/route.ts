import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai';
import { z } from 'zod';
import { bookingAPI } from '@/lib/booking-api';
import { getUser } from '@/lib/session';
import { agentBookingFlag } from '@/lib/flags';

export const maxDuration = 30;

const readTools = {
    listRestaurants: tool({
        description: 'All restaurants on Tablehop with cuisine, neighborhood, price, rating, tags and a short description.',
        inputSchema: z.object({}),
        execute: async () => {
            const { data } = await bookingAPI('/restaurants', 'GET', undefined, 60);
            return (Array.isArray(data) ? data : []).map((r) => ({
                id: r.id, name: r.name, cuisine: r.cuisine, neighborhood: r.neighborhood,
                priceRange: r.priceRange, rating: r.rating, categories: r.categories, description: r.description,
            }));
        },
    }),
    checkAvailability: tool({
        description: 'Open tables at one restaurant for a date and party size. free = number of open tables at that time; 0 means full (waitlist only).',
        inputSchema: z.object({
            restaurantId: z.string(),
            guests: z.number().int().min(1).max(12),
            date: z.string().describe('YYYY-MM-DD').default('2024-06-15'),
        }),
        execute: async ({ restaurantId, guests, date }) => {
            const { status, data } = await bookingAPI(`/restaurants/${restaurantId}/availability?date=${date}&guests=${guests}`);
            if (status !== 200) return { error: 'Restaurant not found' };
            return { restaurantId, name: data.restaurant.name, date, guests, slots: data.slots };
        },
    }),
};

function bookTableFor(dinerName: string) {
    return tool({
        description: 'Book a table for the signed-in diner. Only call after they clearly said yes to a specific restaurant, time and party size.',
        inputSchema: z.object({
            restaurantId: z.string(),
            time: z.string().describe('HH:MM, 24-hour, e.g. 19:30'),
            guests: z.number().int().min(1).max(12),
            date: z.string().describe('YYYY-MM-DD').default('2024-06-15'),
        }),
        execute: async ({ restaurantId, time, guests, date }) => {
            const { status, data } = await bookingAPI('/bookings', 'POST', { restaurantId, date, time, guests, dinerName });
            const { data: r } = await bookingAPI(`/restaurants/${restaurantId}`);
            if (status === 200 || status === 201) {
                return { booked: true, restaurantId, name: r?.name, date, time, guests, tableId: data.tableId };
            }
            return { booked: false, restaurantId, name: r?.name, time, reason: data.error ?? 'That time is no longer available.' };
        },
    });
}

const basePrompt = `You help people in New York pick where to eat on Tablehop.
- Use listRestaurants to see what exists. Only recommend restaurants from that list.
- Before saying a time is open, call checkAvailability. If a time is full, say they can join the waitlist on the restaurant page.
- The demo date is 2024-06-15 unless the person gives another. Ask for party size if it matters; otherwise assume 2.
- Recommend one to three places: name, why it fits, open times. Short and friendly. Plain text, no headings or tables.`;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const user = await getUser();
    const canBook = user?.role === 'diner' && (await agentBookingFlag());

    const tools = canBook ? { ...readTools, bookTable: bookTableFor(user.name) } : readTools;
    const system = canBook
        ? `${basePrompt}
- You CAN book tables with the bookTable tool for ${user.name}. Never tell them to book it themselves.
- Before booking, repeat the restaurant, time and party size and ask "Want me to book it?". When they say yes, call bookTable.
- If bookTable says it wasn't booked, say so and offer the next open time.`
        : `${basePrompt}
- You cannot make bookings. When they pick a time, tell them to tap that time on the card to finish booking on the restaurant page.`;

    const result = streamText({
        model: 'google/gemini-2.5-flash',
        providerOptions: { gateway: { models: ['openai/gpt-4o-mini'] } },
        system,
        messages: await convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(6),
    });

    return result.toUIMessageStreamResponse();
}