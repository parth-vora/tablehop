import Link from 'next/link';
import { bookingAPI } from '@/lib/booking-api';
import DiningChat from '@/components/DiningChat';

export const revalidate = 60;

type Restaurant = {
    id: string;
    name: string;
    neighborhood: string;
    cuisine: string;
    priceRange: string;
    rating: number;
    description: string;
};

export default async function Home() {
    const { data } = await bookingAPI('/restaurants', 'GET', undefined, 60);
    const restaurants: Restaurant[] = Array.isArray(data) ? data : [];

    return (
        <>
            <section className="py-16 sm:py-24">
                <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
                    Book a table. If it’s full, get the next one that opens.
                </h1>
                <p className="mt-6 max-w-xl text-lg text-muted">
                    Join a restaurant’s waitlist and when someone cancels, you can take that slot! 
                </p>
            </section>

            <section aria-labelledby="restaurants">
                <div className="flex items-baseline justify-between border-b border-ink pb-3">
                    <h2 id="restaurants" className="text-sm font-medium">Restaurants</h2>
                    <span className="text-sm text-muted tabular-nums">{restaurants.length} in New York</span>
                </div>

                <ul>
                    {restaurants.map((r) => (
                        <li key={r.id} className="border-b border-line">
                            <Link href={`/r/${r.id}`} className="group grid gap-1 py-6 sm:grid-cols-[1fr_auto] sm:gap-8">
                                <div>
                                    <p className="text-xl font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">
                                        {r.name}
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        {r.cuisine} in {r.neighborhood}
                                    </p>
                                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed">{r.description}</p>
                                </div>
                                <div className="flex gap-4 text-sm tabular-nums sm:flex-col sm:items-end sm:gap-1">
                                    <span>{r.priceRange}</span>
                                    <span className="text-muted">{r.rating?.toFixed(1)} rating</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>

                {restaurants.length === 0 && (
                    <p className="py-10 text-muted">No restaurants yet.</p>
                )}
            </section>

            <DiningChat />
        </>
    );
}
