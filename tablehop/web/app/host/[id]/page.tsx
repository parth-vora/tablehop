import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bookingAPI } from '@/lib/booking-api';
import HostView from './HostView';

export default async function HostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, data: restaurant } = await bookingAPI(`/restaurants/${id}`);

    if (status === 404) notFound();

    return (
        <main>
            <Link href="/">back</Link>
            <h1>{restaurant.name} (host)</h1>
            <HostView restaurantId={id} />
        </main>
    );
}