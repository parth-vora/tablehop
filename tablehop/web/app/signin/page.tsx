import { bookingAPI } from '@/lib/booking-api';
import SignInForm from './SignInForm';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; as?: string }> }) {
    const { next = '', as } = await searchParams;
    const { data } = await bookingAPI('/restaurants', 'GET', undefined, 60);
    const restaurants = (Array.isArray(data) ? data : []).map((r: { id: string; name: string; neighborhood: string }) => ({
        id: r.id,
        name: r.name,
        neighborhood: r.neighborhood,
    }));

    return (
        <div className="py-16 sm:py-20">
            <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Sign in</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
                Diners book tables and get waitlist offers. 
            </p>
            <SignInForm restaurants={restaurants} next={next} startAsHost={as === 'host'} />
        </div>
    );
}
