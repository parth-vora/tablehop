import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bookingAPI } from '@/lib/booking-api';
import DiningChat from '@/components/DiningChat';
import BookingForm from './BookingForm';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, data: restaurant } = await bookingAPI(`/restaurants/${id}`);

    if (status === 404) notFound();

    return (
        <div className="py-10 sm:py-14">
            <Link href="/" className="text-sm text-muted hover:text-ink">All restaurants</Link>

            <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-16">
                <section>
                    <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">{restaurant.name}</h1>
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[15px] tabular-nums">
                        <span>{restaurant.cuisine}</span>
                        <span>{restaurant.neighborhood}</span>
                        <span>{restaurant.priceRange}</span>
                        <span className="text-muted">{restaurant.rating?.toFixed(1)} rating</span>
                    </div>
                    <p className="mt-8 max-w-lg text-lg leading-relaxed">{restaurant.description}</p>

                    {restaurant.categories?.length > 0 && (
                        <ul className="mt-8 flex flex-wrap gap-2">
                            {restaurant.categories.map((c: string) => (
                                <li key={c} className="rounded-full bg-wash px-3 py-1 text-sm">{c}</li>
                            ))}
                        </ul>
                    )}
                </section>

                <BookingForm restaurantId={id} restaurantName={restaurant.name} />
            </div>

            <DiningChat />
        </div>
    );
}
