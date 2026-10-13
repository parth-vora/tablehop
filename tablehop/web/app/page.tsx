import Image from 'next/image';
import { bookingAPI } from '@/lib/booking-api';
import DiningChat from '@/components/DiningChat';
import StageCard from '@/components/StageCard';
import PixelIcon from '@/components/PixelIcon';

export const revalidate = 60;

type Restaurant = {
    id: string;
    name: string;
    neighborhood: string;
    cuisine: string;
    priceRange: string;
    rating: number;
    description: string;
};

const howToPlay = [
    { step: '1', title: 'Pick a spot', text: 'Choose a restaurant and a time.' },
    { step: '2', title: 'Book or wait', text: 'Fully booked? Join the waitlist instead.' },
    { step: '3', title: 'Snag a cancellation', text: 'Someone cancels, you get 60 seconds to claim the table.' },
];

export default async function Home() {
    const { data } = await bookingAPI('/restaurants', 'GET', undefined, 60);
    const restaurants: Restaurant[] = Array.isArray(data) ? data : [];

    return (
        <>
            <section className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr]">
                <div>
                    <p className="flex items-center gap-2 font-pixel text-[10px] text-coin">
                        <PixelIcon name="arrow" size={10} className="animate-blink" />
                        NOW SEATING · NEW YORK
                    </p>
                    <h1 className="mt-6 font-pixel text-xl leading-[1.6] text-balance sm:text-3xl sm:leading-[1.5]">
                        Book a table. If it’s full, get the next one that opens.
                    </h1>
                    <p className="mt-6 max-w-xl text-xl text-muted">
                        Join a restaurant’s waitlist and when someone cancels, you can take that slot!
                    </p>
                    <a
                        href="#restaurants"
                        className="px-btn mt-9 inline-flex items-center gap-3 bg-alert px-6 py-4 font-pixel text-xs text-ink"
                    >
                        FIND A TABLE
                        <PixelIcon name="arrow" size={10} />
                    </a>
                </div>

                <figure className="px-panel relative bg-void [--frame:var(--color-coin)]">
                    <Image
                        src="/images/hero-street.png"
                        alt="Pixel art of a glowing New York restaurant at night"
                        width={1024}
                        height={1024}
                        priority
                        className="pixelated aspect-[4/3] w-full object-cover"
                    />
                    <figcaption className="px-frame absolute -bottom-4 left-4 bg-open px-3 py-2 font-pixel text-[9px] text-void">
                        TABLES OPEN TONIGHT
                    </figcaption>
                </figure>
            </section>

            <section aria-labelledby="how-to-play" className="mt-6">
                <h2 id="how-to-play" className="sr-only">How it works</h2>
                <ol className="grid gap-6 sm:grid-cols-3">
                    {howToPlay.map((s) => (
                        <li key={s.step} className="px-frame flex gap-4 bg-paper p-4 [--frame:var(--color-line)]">
                            <span className="font-pixel text-lg text-coin">{s.step}</span>
                            <span>
                                <span className="block font-pixel text-[10px] leading-relaxed">{s.title}</span>
                                <span className="mt-1 block text-muted">{s.text}</span>
                            </span>
                        </li>
                    ))}
                </ol>
            </section>

            <section aria-labelledby="restaurants" className="mt-16 scroll-mt-24">
                <div className="flex items-baseline justify-between gap-4 border-b-4 border-line pb-4">
                    <h2 id="restaurants" className="font-pixel text-xs sm:text-sm">ON THE MENU TONIGHT</h2>
                    <span className="font-pixel text-[9px] text-muted">{restaurants.length} IN NEW YORK</span>
                </div>

                <ul className="mt-8 grid gap-8 sm:grid-cols-2">
                    {restaurants.map((r, i) => (
                        <li key={r.id}>
                            <StageCard restaurant={r} index={i} />
                        </li>
                    ))}
                </ul>

                {restaurants.length === 0 && (
                    <p className="py-10 font-pixel text-[10px] text-muted">No restaurants yet.</p>
                )}
            </section>

            <DiningChat />
        </>
    );
}
