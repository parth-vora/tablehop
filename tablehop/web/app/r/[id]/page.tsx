import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bookingAPI } from '@/lib/booking-api';
import DiningChat from '@/components/DiningChat';
import PixelIcon, { Coins, Hearts } from '@/components/PixelIcon';
import BookingForm from './BookingForm';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, data: restaurant } = await bookingAPI(`/restaurants/${id}`);

    if (status === 404) notFound();

    return (
        <div className="py-10 sm:py-14">
            <Link href="/" className="inline-flex items-center gap-2 font-pixel text-[9px] text-muted hover:text-ink">
                <PixelIcon name="arrow" size={9} className="rotate-180" />
                ALL RESTAURANTS
            </Link>

            <div className="mt-10 grid gap-14 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-16">
                <section className="animate-enter">
                    <p className="font-pixel text-[9px] text-coin">NOW ENTERING</p>
                    <h1 className="mt-4 font-pixel text-2xl leading-[1.5] text-balance sm:text-4xl sm:leading-[1.4]">
                        {restaurant.name}
                    </h1>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span className="px-frame bg-wash px-3 py-1 [--frame:var(--color-line)]">{restaurant.cuisine}</span>
                        <span className="px-frame bg-wash px-3 py-1 [--frame:var(--color-line)]">{restaurant.neighborhood}</span>
                        <span className="px-3">
                            <Coins price={restaurant.priceRange} />
                        </span>
                        <Hearts rating={restaurant.rating} />
                    </div>
                    <p className="mt-8 max-w-lg text-xl leading-relaxed">{restaurant.description}</p>

                    {restaurant.categories?.length > 0 && (
                        <div className="mt-10">
                            <h2 className="font-pixel text-[9px] text-muted">PERKS</h2>
                            <ul className="mt-4 flex flex-wrap gap-3">
                                {restaurant.categories.map((c: string) => (
                                    <li key={c} className="px-frame flex items-center gap-2 bg-paper px-3 py-1 [--frame:var(--color-open)]">
                                        <PixelIcon name="star" size={10} className="text-coin" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <BookingForm restaurantId={id} restaurantName={restaurant.name} />
            </div>

            <DiningChat />
        </div>
    );
}
