import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai';
import { z } from 'zod';
import { bookingAPI } from '@/lib/booking-api';

export const maxDuration = 30;

const tools = {
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

const system = `You help people in New York pick where to eat on Tablehop.
- Use listRestaurants to see what exists. Only recommend restaurants from that list.
- Before saying a time is open, call checkAvailability. If a time is full, say they can join the waitlist and get offered the next table that opens.
- The demo date is 2024-06-15 unless the person gives another. Ask for party size if it matters and they haven't said; otherwise assume 2.
- Recommend one to three places. For each: name, why it fits, and open times. Keep it short and friendly. Plain text, no markdown headings or tables.`;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

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
