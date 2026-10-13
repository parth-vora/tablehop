'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { parseUser, USER_COOKIE, type User } from './user';

// read the cookie in the browser so pages like the home page can stay cached (ISR).
// re-reads on every page change, so the header updates right after sign in / out.
// undefined = not checked yet, null = signed out
export function useUser() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null | undefined>(undefined);

    useEffect(() => {
        const raw = document.cookie
            .split('; ')
            .find((c) => c.startsWith(USER_COOKIE + '='))
            ?.slice(USER_COOKIE.length + 1);
        setUser(parseUser(raw ? decodeURIComponent(raw) : undefined));
    }, [pathname]);

    return user;
}
