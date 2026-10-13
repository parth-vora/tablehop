import { redirect } from 'next/navigation';
import { getUser } from '@/lib/session';

export default async function HostIndex() {
    const user = await getUser();
    redirect(user?.role === 'host' ? `/host/${user.restaurantId}` : '/signin');
}
