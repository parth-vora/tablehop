import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bookingAPI } from '@/lib/booking-api';
import BookingForm from './BookingForm';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, data: restaurant } = await bookingAPI(`/restaurants/${id}`);

    if (status === 404) notFound();

    return (
        <main>
            <Link href="/">back</Link>
            <h1>{restaurant.name}</h1>
            <p>{restaurant.cuisine}, {restaurant.neighborhood}, {restaurant.priceRange}</p>
            <p>{restaurant.description}</p>

            <BookingForm restaurantId={id} />
        </main>
    );
}