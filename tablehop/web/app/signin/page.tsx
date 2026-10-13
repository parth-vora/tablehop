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
            <p className="font-pixel text-[9px] text-coin">WELCOME IN</p>
            <h1 className="mt-4 font-pixel text-2xl sm:text-3xl">Sign in</h1>
            <p className="mt-5 max-w-xl text-xl text-muted">
                Diners book tables and get waitlist offers. 
            </p>
            <SignInForm restaurants={restaurants} next={next} startAsHost={as === 'host'} />
        </div>
    );
}
