'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/use-user';
import { signOut } from '@/app/signin/actions';
import { sfx, setSfxEnabled, useSfxEnabled } from '@/lib/sfx';
import PixelIcon from './PixelIcon';

export default function SiteHeader() {
    const user = useUser();
    const pathname = usePathname();
    const sound = useSfxEnabled();

    const links = [{ href: '/', label: 'Restaurants' }];
    if (user?.role === 'diner') links.push({ href: '/me', label: 'My reservations' });
    if (user?.role === 'host') links.push({ href: `/host/${user.restaurantId}`, label: 'Host stand' });

    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

    const navLink = (l: { href: string; label: string }) => {
        const active = isActive(l.href);
        return (
            <Link
                key={l.href}
                href={l.href}
                onClick={() => sfx('blip')}
                aria-current={active ? 'page' : undefined}
                className={[
                    'group flex items-center gap-2 font-pixel text-[9px] uppercase tracking-wider',
                    active ? 'text-coin' : 'text-muted hover:text-ink',
                ].join(' ')}
            >
                <PixelIcon
                    name="arrow"
                    size={9}
                    className={active ? 'animate-blink' : 'opacity-0 group-hover:opacity-100'}
                />
                {l.label}
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-30 border-b-4 border-void bg-paper/95 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
                <Link href="/" onClick={() => sfx('blip')} className="group flex items-center gap-3">
                    <span
                        aria-hidden
                        className="px-frame grid size-8 place-items-center bg-alert font-pixel text-xs text-ink group-hover:animate-bob"
                    >
                        T
                    </span>
                    <span className="font-pixel text-[11px] tracking-wider sm:text-xs">TABLEHOP</span>
                </Link>

                <nav aria-label="Main" className="hidden gap-6 md:flex">
                    {links.map(navLink)}
                </nav>

                <div className="ml-auto flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setSfxEnabled(!sound)}
                        aria-pressed={sound}
                        className="font-pixel text-[9px] text-muted hover:text-ink"
                    >
                        SOUND <span className={sound ? 'text-open' : 'text-alert'}>{sound ? 'ON' : 'OFF'}</span>
                    </button>

                    {user === null && (
                        <Link
                            href="/signin"
                            onClick={() => sfx('select')}
                            className="px-btn bg-coin px-4 py-2.5 font-pixel text-[10px] text-void"
                        >
                            SIGN IN
                        </Link>
                    )}
                    {user && (
                        <>
                            <span className="hidden items-center gap-2 text-muted sm:flex">
                                <span className="font-pixel text-[9px] text-open">{user.role === 'host' ? 'HOST' : 'DINER'}</span>
                                {user.role === 'host' ? user.restaurantName : user.name}
                            </span>
                            <form action={signOut}>
                                <button
                                    onClick={() => sfx('back')}
                                    className="px-btn bg-wash px-4 py-2.5 font-pixel text-[10px] text-ink"
                                >
                                    SIGN OUT
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <nav aria-label="Main mobile" className="mx-auto flex max-w-5xl gap-6 overflow-x-auto px-4 pb-3 md:hidden">
                {links.map(navLink)}
            </nav>
        </header>
    );
}
