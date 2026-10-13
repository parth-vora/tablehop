'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from './user';

export function useUser() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null | undefined>(undefined);

    useEffect(() => {
        fetch('/api/me', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => setUser(d.user ?? null))
            .catch(() => setUser(null));
    }, [pathname]);

    return user;
}