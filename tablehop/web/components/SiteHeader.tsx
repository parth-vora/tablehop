'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/use-user';
import { signOut } from '@/app/signin/actions';

export default function SiteHeader() {
    const user = useUser();
    const pathname = usePathname();

    const links = [{ href: '/', label: 'Restaurants' }];
    if (user?.role === 'diner') links.push({ href: '/me', label: 'My reservations' });
    if (user?.role === 'host') links.push({ href: `/host/${user.restaurantId}`, label: 'Host stand' });

    return (
        <header className="border-b border-line">
            <div className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-4 sm:px-6">
                <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
                    <span aria-hidden className="grid size-6 place-items-center rounded-md bg-ink text-[13px] text-paper">t</span>
                    Tablehop
                </Link>

                <nav className="hidden gap-6 text-sm sm:flex">
                    {links.map((l) => {
                        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
                        return (
                            <Link key={l.href} href={l.href} className={active ? 'text-ink' : 'text-muted hover:text-ink'}>
                                {l.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-3 text-sm">
                    {user === null && (
                        <Link href="/signin" className="rounded-full bg-ink px-4 py-2 font-medium text-paper hover:bg-ink/80">
                            Sign in
                        </Link>
                    )}
                    {user && (
                        <>
                            <span className="hidden text-muted sm:inline">
                                {user.role === 'host' ? `Host, ${user.restaurantName}` : user.name}
                            </span>
                            <form action={signOut}>
                                <button className="rounded-full border border-line px-4 py-2 font-medium hover:border-ink">
                                    Sign out
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {}
            <nav className="mx-auto flex max-w-5xl gap-6 px-4 pb-3 text-sm sm:hidden">
                {links.map((l) => (
                    <Link key={l.href} href={l.href} className={pathname === l.href ? 'text-ink' : 'text-muted'}>
                        {l.label}
                    </Link>
                ))}
            </nav>
        </header>
    );
}
