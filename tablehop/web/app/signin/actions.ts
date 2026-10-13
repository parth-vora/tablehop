'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { USER_COOKIE, type User } from '@/lib/user';
import { bookingAPI } from '@/lib/booking-api';


const PASSWORD = process.env.DEMO_PASSWORD ?? 'password';

export type SignInState = { error?: string } | null;

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
    const role = formData.get('role') === 'host' ? 'host' : 'diner';
    const name = String(formData.get('name') ?? '').trim();
    const restaurantId = String(formData.get('restaurantId') ?? '');
    const next = String(formData.get('next') ?? '');

    if (role === 'diner' && !name) return { error: 'Enter your name.' };
    if (role === 'host' && !restaurantId) return { error: 'Choose your restaurant.' };
    if (formData.get('password') !== PASSWORD) return { error: 'Wrong password. Check the README for the demo password.' };

    const user: User = { name, role };
    if (role === 'host') {
        const { status, data } = await bookingAPI(`/restaurants/${restaurantId}`);
        if (status !== 200) return { error: 'That restaurant doesn’t exist.' };
        user.name = data.name;
        user.restaurantId = restaurantId;
        user.restaurantName = data.name;
    }

    const store = await cookies();
    store.set(USER_COOKIE, JSON.stringify(user), {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
    });
    if (role === 'diner' && next.startsWith('/') && !next.startsWith('//')) redirect(next);
    redirect(role === 'host' ? `/host/${restaurantId}` : '/me');
}

export async function signOut() {
    const store = await cookies();
    store.delete(USER_COOKIE);
    redirect('/signin');
}
