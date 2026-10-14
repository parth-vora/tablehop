'use client';

import Image from 'next/image';
import { useActionState, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import PixelIcon from '@/components/PixelIcon';
import { signIn, signUp, type SignInState } from './actions';

type Restaurant = { id: string; name: string; neighborhood: string };

const field =
    'px-frame mt-3 block w-full bg-paper px-3 py-2.5 text-ink outline-none [--frame:var(--color-line)] focus:[--frame:var(--color-coin)]';

export default function SignInForm({ restaurants, next, startAsHost }: { restaurants: Restaurant[]; next: string; startAsHost: boolean }) {
    const [signInState, signInAction, signingIn] = useActionState<SignInState, FormData>(signIn, null);
    const [signUpState, signUpAction, signingUp] = useActionState<SignInState, FormData>(signUp, null);
    const [role, setRole] = useState<'diner' | 'host'>(startAsHost ? 'host' : 'diner');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [name, setName] = useState('');
    const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? '');
    const password = useRef<HTMLInputElement>(null);

    const creating = role === 'diner' && mode === 'signup';
    const state = creating ? signUpState : signInState;
    const pending = creating ? signingUp : signingIn;

    function switchMode(m: 'signin' | 'signup') {
        sfx('blip');
        setMode(m);
    }

    return (
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
            <form action={creating ? signUpAction : signInAction} onSubmit={() => sfx('select')} className="px-panel bg-wash p-5 sm:p-6">
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
                                if (r === 'host') setMode('signin');
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

                {role === 'diner' && (
                    <p className="mt-6 font-pixel text-[10px] text-coin">
                        {creating ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}
                    </p>
                )}

                <div key={`${role}-${mode}`} className="animate-enter mt-6">
                    {role === 'diner' ? (
                        <label className="block">
                            <span className="font-pixel text-[9px] text-muted">YOUR NAME</span>
                            <input
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete={creating ? 'name' : 'username'}
                                placeholder={creating ? 'Alex Kim' : 'Maya Chen'}
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
                    <input
                        ref={password}
                        name="password"
                        type="password"
                        autoComplete={creating ? 'new-password' : 'current-password'}
                        minLength={creating ? 8 : undefined}
                        className={field}
                    />
                    {creating && <span className="mt-2 block text-sm text-muted">At least 8 characters.</span>}
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
                    {pending
                        ? creating ? 'Creating account…' : 'Signing in…'
                        : creating ? 'Create account' : role === 'diner' ? 'Sign in as a diner' : 'Sign in as host'}
                </button>

                {role === 'diner' && (
                    <p className="mt-4 text-muted">
                        {creating ? (
                            <>
                                Already have an account?{' '}
                                <button type="button" onClick={() => switchMode('signin')} className="text-coin underline underline-offset-4 hover:text-ink">
                                    Sign in
                                </button>
                            </>
                        ) : (
                            <>
                                New here?{' '}
                                <button type="button" onClick={() => switchMode('signup')} className="text-coin underline underline-offset-4 hover:text-ink">
                                    Create an account
                                </button>
                            </>
                        )}
                    </p>
                )}
                {role === 'host' && <p className="mt-4 text-muted">Hosts use the demo password in the README.</p>}
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
                    <span className="font-pixel text-[9px] text-coin">CHEF:</span>{' '}
                    {role === 'host'
                        ? 'Kitchen’s open!'
                        : creating
                          ? 'Welcome!'
                          : 'Grab a table.'}
                </figcaption>
            </figure>
        </div>
    );
}