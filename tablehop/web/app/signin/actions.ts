'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { USER_COOKIE, dinerId, type User } from '@/lib/user';
import { bookingAPI } from '@/lib/booking-api';

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'password';
const DEMO_DINERS = ['maya-chen', 'jordan-blake', 'priya-raman', 'jane-smith', 'sam-rivera'];

export type SignInState = { error?: string } | null;

async function startSession(user: User) {
    const store = await cookies();
    store.set(USER_COOKIE, JSON.stringify(user), {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
    });
}

function safeNext(next: string) {
    return next.startsWith('/') && !next.startsWith('//') ? next : '';
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
    const role = formData.get('role') === 'host' ? 'host' : 'diner';
    const name = String(formData.get('name') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const restaurantId = String(formData.get('restaurantId') ?? '');
    const next = safeNext(String(formData.get('next') ?? ''));

    if (role === 'host') {
        if (!restaurantId) return { error: 'Choose your restaurant.' };
        const { status } = await bookingAPI('/hosts/login', 'POST', { restaurantId, password });
        if (status === 401) return { error: 'Wrong password.' };
        if (status === 404 && password !== DEMO_PASSWORD) {
            return { error: 'Wrong password. Sample restaurants use the demo password in the README.' };
        }
        const { status: found, data } = await bookingAPI(`/restaurants/${restaurantId}`);
        if (found !== 200) return { error: 'That restaurant doesn’t exist.' };
        await startSession({ name: data.name, role, restaurantId, restaurantName: data.name });
        redirect(`/host/${restaurantId}`);
    }

    if (!name) return { error: 'Enter your name.' };

    const { status, data } = await bookingAPI('/users/login', 'POST', { name, password });
    if (status === 401) return { error: 'Wrong password.' };

    if (status === 404) {
        if (!DEMO_DINERS.includes(dinerId(name))) {
            return { error: 'No account with that name. Tap “Create an account” to sign up.' };
        }
        if (password !== DEMO_PASSWORD) {
            return { error: 'Wrong password. Demo accounts use the password in the README.' };
        }
    } else if (status !== 200) {
        return { error: 'Couldn’t sign you in. Try again.' };
    }

    await startSession({ name: status === 200 ? data.name : name, role: 'diner' });
    redirect(next || '/me');
}

export async function signUp(_prev: SignInState, formData: FormData): Promise<SignInState> {
    const name = String(formData.get('name') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const next = safeNext(String(formData.get('next') ?? ''));

    if (!name) return { error: 'Enter your name.' };
    if (DEMO_DINERS.includes(dinerId(name))) return { error: 'That’s a demo account. Sign in with the demo password instead.' };
    if (password.length < 8) return { error: 'Use a password with at least 8 characters.' };

    const { status, data } = await bookingAPI('/users', 'POST', { name, password });
    if (status !== 201) return { error: data.error ?? 'Couldn’t create your account. Try again.' };

    await startSession({ name: data.name, role: 'diner' });
    redirect(next || '/me');
}

export async function addRestaurant(_prev: SignInState, formData: FormData): Promise<SignInState> {
    const field = (k: string) => String(formData.get(k) ?? '').trim();
    const password = String(formData.get('password') ?? '');
    if (password.length < 8) return { error: 'Use a password with at least 8 characters.' };

    const { status, data } = await bookingAPI('/restaurants', 'POST', {
        name: field('restaurantName'),
        neighborhood: field('neighborhood'),
        cuisine: field('cuisine'),
        priceRange: field('priceRange'),
        description: field('description'),
        tables: { two: Number(formData.get('two') || 0), four: Number(formData.get('four') || 0), six: Number(formData.get('six') || 0) },
        password,
    });
    if (status !== 201) return { error: data.error ?? 'Couldn’t add your restaurant. Try again.' };

    revalidatePath('/');
    revalidatePath('/signin');

    await startSession({ name: data.name, role: 'host', restaurantId: data.id, restaurantName: data.name });
    redirect(`/host/${data.id}`);
}

export async function signOut() {
    const store = await cookies();
    store.delete(USER_COOKIE);
    redirect('/signin');
}