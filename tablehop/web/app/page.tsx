import Link from 'next/link';
import { bookingAPI } from '@/lib/booking-api';
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
        <main className="mx-auto max-w-4xl p-8">
            <h1 className="text-3xl font-bold">Tablehop</h1>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {restaurants.map((r: Restaurant) => (
                    <Link
                        key={r.id}
                        href={`/r/${r.id}`}
                    >
                        <h2>{r.name}</h2>
                        <p>{r.cuisine}, {r.neighborhood}, {r.priceRange} </p>
                        <p>{r.description}</p>
                    </Link>
                ))}
            </div>
        </main>
    );
}