import Link from 'next/link';
import { bookingAPI } from '@/lib/booking-api';

// ISR: built once, served from Vercel's cache, rebuilt at most every 60s
export const revalidate = 60;

type Restaurant = {
    id: string;
    name: string;
    neighborhood: string;
    cuisine: string;
    priceRange: string;
    description: string;
};

export default async function Home() {
    const { data: restaurants } = await bookingAPI('/restaurants', 'GET', undefined, 60);

    return (
        <main>
            <h1>Tablehop</h1>
            <ul>
                {restaurants.map((r: Restaurant) => (
                    <li key={r.id}>
                        <Link href={`/r/${r.id}`}>{r.name}</Link>
                        <p>{r.cuisine}, {r.neighborhood}, {r.priceRange}</p>
                        <p>{r.description}</p>
                    </li>
                ))}
            </ul>
        </main>
    );
}