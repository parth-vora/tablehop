import { notFound, redirect } from 'next/navigation';
import { bookingAPI } from '@/lib/booking-api';
import { getUser } from '@/lib/session';
import HostView from './HostView';

export default async function HostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // only this restaurant's host gets in
    const user = await getUser();
    if (user?.role !== 'host' || user.restaurantId !== id) redirect(`/signin?as=host`);

    const { status, data: restaurant } = await bookingAPI(`/restaurants/${id}`);
    if (status === 404) notFound();

    return (
        <div className="py-12 sm:py-16">
            <p className="font-pixel text-[9px] text-coin">HOST STAND · CONTROL ROOM</p>
            <h1 className="mt-4 font-pixel text-2xl leading-[1.5] text-balance sm:text-3xl">{restaurant.name}</h1>
            <HostView restaurantId={id} />
        </div>
    );
}
