'use client';

import { useActionState, useRef, useState } from 'react';
import { signIn, type SignInState } from './actions';

type Restaurant = { id: string; name: string; neighborhood: string };

export default function SignInForm({ restaurants, next, startAsHost }: { restaurants: Restaurant[]; next: string; startAsHost: boolean }) {
    const [state, action, pending] = useActionState<SignInState, FormData>(signIn, null);
    const [role, setRole] = useState<'diner' | 'host'>(startAsHost ? 'host' : 'diner');
    const [name, setName] = useState('');
    const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? '');
    const password = useRef<HTMLInputElement>(null);

    function pick(fill: () => void) {
        fill();
        password.current?.focus();
    }

    return (
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
            <form action={action} className="rounded-2xl border border-line p-5 sm:p-6">
                <div role="tablist" aria-label="Account type" className="grid grid-cols-2 rounded-full bg-wash p-1 text-sm font-medium">
                    {(['diner', 'host'] as const).map((r) => (
                        <button
                            key={r}
                            type="button"
                            role="tab"
                            aria-selected={role === r}
                            onClick={() => setRole(r)}
                            className={['rounded-full py-2 transition-all', role === r ? 'bg-paper shadow-sm' : 'text-muted hover:text-ink'].join(' ')}
                        >                            {r === 'diner' ? 'Diner' : 'Host'}
                        </button>
                    ))}
                </div>

                <input type="hidden" name="role" value={role} />
                <input type="hidden" name="next" value={next} />

                <div key={role} className="animate-enter mt-6">
                    {role === 'diner' ? (
                        <label className="block text-sm">
                            <span className="text-muted">Your name</span>
                            <input
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="username"
                                placeholder="Maya Chen"
                                className="mt-1 block w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-ink"
                            />
                        </label>
                    ) : (
                        <label className="block text-sm">
                            <span className="text-muted">Restaurant</span>
                            <select
                                name="restaurantId"
                                value={restaurantId}
                                onChange={(e) => setRestaurantId(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2.5 outline-none focus:border-ink"
                            >
                                {restaurants.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>

                <label className="mt-4 block text-sm">
                    <span className="text-muted">Password</span>
                    <input
                        ref={password}
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        className="mt-1 block w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-ink"
                    />
                </label>

                {state?.error && (
                    <p role="alert" className="animate-pop mt-4 rounded-lg bg-wash px-4 py-3 text-sm text-alert">
                        {state.error}
                    </p>
                )}

                <button
                    disabled={pending}
                    className="mt-6 w-full rounded-full bg-ink py-3 font-medium text-paper transition hover:bg-ink/80 disabled:opacity-60"
                >
                    {pending ? 'Signing in…' : role === 'diner' ? 'Sign in as a diner' : 'Sign in as host'}
                </button>
                <p className="mt-4 text-sm text-muted">New diner? Type any name. (The demo password is in the README.)</p>
            </form>

        </div>
    );
}
