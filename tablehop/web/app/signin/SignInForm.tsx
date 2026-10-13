'use client';

import Image from 'next/image';
import { useActionState, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import PixelIcon from '@/components/PixelIcon';
import { signIn, type SignInState } from './actions';

type Restaurant = { id: string; name: string; neighborhood: string };

const field =
    'px-frame mt-3 block w-full bg-paper px-3 py-2.5 text-ink outline-none [--frame:var(--color-line)] focus:[--frame:var(--color-coin)]';

export default function SignInForm({ restaurants, next, startAsHost }: { restaurants: Restaurant[]; next: string; startAsHost: boolean }) {
    const [state, action, pending] = useActionState<SignInState, FormData>(signIn, null);
    const [role, setRole] = useState<'diner' | 'host'>(startAsHost ? 'host' : 'diner');
    const [name, setName] = useState('');
    const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? '');
    const password = useRef<HTMLInputElement>(null);

    return (
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
            <form action={action} onSubmit={() => sfx('select')} className="px-panel bg-wash p-5 sm:p-6">
                <div role="tablist" aria-label="Account type" className="grid grid-cols-2 gap-3">
                    {(['diner', 'host'] as const).map((r) => (
                        <button
                            key={r}
                            type="button"
                            role="tab"
                            aria-selected={role === r}
                            onClick={() => {
                                sfx('blip');
                                setRole(r);
                            }}
                            className={[
                                'px-frame flex items-center justify-center gap-2 py-3 font-pixel text-[10px]',
                                role === r ? 'bg-coin text-void [--frame:var(--color-ink)]' : 'bg-paper text-muted [--frame:var(--color-line)] hover:text-ink',
                            ].join(' ')}
                        >
                            {role === r && <PixelIcon name="arrow" size={8} className="animate-blink" />}
                            {r === 'diner' ? 'Diner' : 'Host'}
                        </button>
                    ))}
                </div>

                <input type="hidden" name="role" value={role} />
                <input type="hidden" name="next" value={next} />

                <div key={role} className="animate-enter mt-6">
                    {role === 'diner' ? (
                        <label className="block">
                            <span className="font-pixel text-[9px] text-muted">YOUR NAME</span>
                            <input
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="username"
                                placeholder="Maya Chen"
                                className={`${field} placeholder:text-muted/60`}
                            />
                        </label>
                    ) : (
                        <label className="block">
                            <span className="font-pixel text-[9px] text-muted">RESTAURANT</span>
                            <select
                                name="restaurantId"
                                value={restaurantId}
                                onChange={(e) => setRestaurantId(e.target.value)}
                                className={field}
                            >
                                {restaurants.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>

                <label className="mt-5 block">
                    <span className="font-pixel text-[9px] text-muted">PASSWORD</span>
                    <input ref={password} name="password" type="password" autoComplete="current-password" className={field} />
                </label>

                {state?.error && (
                    <p role="alert" className="px-frame animate-shake mt-5 bg-paper px-4 py-3 text-alert [--frame:var(--color-alert)]">
                        {state.error}
                    </p>
                )}

                <button
                    disabled={pending}
                    className="px-btn mt-6 w-full bg-alert py-4 font-pixel text-[10px] text-ink disabled:opacity-60"
                >
                    {pending ? 'Signing in…' : role === 'diner' ? 'Sign in as a diner' : 'Sign in as host'}
                </button>
                <p className="mt-4 text-muted">New diner? Type any name. (The demo password is in the README.)</p>
            </form>

            <figure className="hidden flex-col items-center gap-4 lg:flex">
                <div className="px-frame animate-bob bg-paper p-4 [--frame:var(--color-coin)]">
                    <Image
                        src="/images/chef.png"
                        alt="Pixel art chef holding a plate"
                        width={256}
                        height={256}
                        className="pixelated size-56"
                    />
                </div>
                <figcaption className="px-frame bg-paper px-4 py-3 text-center [--frame:var(--color-line)]">
                    <span className="font-pixel text-[9px] text-coin">CHEF:</span> {role === 'diner' ? 'Welcome! Grab a table.' : 'Kitchen’s open. Let’s run the floor.'}
                </figcaption>
            </figure>
        </div>
    );
}
