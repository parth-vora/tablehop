'use client';

import Image from 'next/image';
import { useActionState, useState } from 'react';
import { sfx } from '@/lib/sfx';
import PixelIcon from '@/components/PixelIcon';
import { addRestaurant, signIn, signUp, type SignInState } from './actions';

type Restaurant = { id: string; name: string; neighborhood: string };

const field =
    'px-frame mt-3 block w-full bg-paper px-3 py-2.5 text-ink outline-none [--frame:var(--color-line)] focus:[--frame:var(--color-coin)]';
const label = 'font-pixel text-[9px] text-muted';

export default function SignInForm({ restaurants, next, startAsHost }: { restaurants: Restaurant[]; next: string; startAsHost: boolean }) {
    const [signInState, signInAction, signingIn] = useActionState<SignInState, FormData>(signIn, null);
    const [signUpState, signUpAction, signingUp] = useActionState<SignInState, FormData>(signUp, null);
    const [addState, addAction, adding] = useActionState<SignInState, FormData>(addRestaurant, null);
    const [role, setRole] = useState<'diner' | 'host'>(startAsHost ? 'host' : 'diner');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [name, setName] = useState('');
    const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? '');

    const creating = mode === 'signup';
    const action = !creating ? signInAction : role === 'diner' ? signUpAction : addAction;
    const state = !creating ? signInState : role === 'diner' ? signUpState : addState;
    const pending = !creating ? signingIn : role === 'diner' ? signingUp : adding;

    const heading = !creating ? 'WELCOME BACK' : role === 'diner' ? 'CREATE YOUR ACCOUNT' : 'ADD YOUR RESTAURANT';
    const submit = pending
        ? creating ? 'Setting up…' : 'Signing in…'
        : !creating
          ? role === 'diner' ? 'Sign in as a diner' : 'Sign in as host'
          : role === 'diner' ? 'Create account' : 'Add my restaurant';

    function switchMode(m: 'signin' | 'signup') {
        sfx('blip');
        setMode(m);
    }

    return (
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-16">
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

                <p className="mt-6 font-pixel text-[10px] text-coin">{heading}</p>

                <div key={`${role}-${mode}`} className="animate-enter mt-6 space-y-5">
                    {role === 'diner' && (
                        <label className="block">
                            <span className={label}>YOUR NAME</span>
                            <input
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete={creating ? 'name' : 'username'}
                                placeholder={creating ? 'Alex Kim' : 'Maya Chen'}
                                className={`${field} placeholder:text-muted/60`}
                            />
                        </label>
                    )}

                    {role === 'host' && !creating && (
                        <label className="block">
                            <span className={label}>RESTAURANT</span>
                            <select name="restaurantId" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className={field}>
                                {restaurants.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {role === 'host' && creating && (
                        <>
                            <label className="block">
                                <span className={label}>RESTAURANT NAME</span>
                                <input name="restaurantName" required placeholder="Corner Bistro" className={`${field} placeholder:text-muted/60`} />
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className={label}>NEIGHBORHOOD</span>
                                    <input name="neighborhood" required placeholder="West Village" className={`${field} placeholder:text-muted/60`} />
                                </label>
                                <label className="block">
                                    <span className={label}>CUISINE</span>
                                    <input name="cuisine" required placeholder="American" className={`${field} placeholder:text-muted/60`} />
                                </label>
                            </div>
                            <label className="block">
                                <span className={label}>PRICE</span>
                                <select name="priceRange" defaultValue="$$" className={field}>
                                    {['$', '$$', '$$$', '$$$$'].map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className={label}>DESCRIPTION</span>
                                <textarea
                                    name="description"
                                    rows={2}
                                    placeholder="What makes it worth the trip?"
                                    className={`${field} resize-none placeholder:text-muted/60`}
                                />
                            </label>
                            <fieldset>
                                <legend className={label}>TABLES</legend>
                                <div className="mt-3 grid grid-cols-3 gap-3">
                                    {(
                                        [
                                            ['two', '2 seats', 2],
                                            ['four', '4 seats', 2],
                                            ['six', '6 seats', 1],
                                        ] as const
                                    ).map(([key, text, start]) => (
                                        <label key={key} className="block text-center">
                                            <input
                                                name={key}
                                                type="number"
                                                min={0}
                                                max={20}
                                                defaultValue={start}
                                                className="px-frame block w-full bg-paper px-2 py-2 text-center font-pixel text-[11px] text-ink outline-none [--frame:var(--color-line)] focus:[--frame:var(--color-coin)]"
                                            />
                                            <span className="mt-1.5 block text-sm text-muted">{text}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </>
                    )}

                    <label className="block">
                        <span className={label}>PASSWORD</span>
                        <input
                            name="password"
                            type="password"
                            autoComplete={creating ? 'new-password' : 'current-password'}
                            minLength={creating ? 8 : undefined}
                            className={field}
                        />
                        {creating && <span className="mt-2 block text-sm text-muted">At least 8 characters.</span>}
                    </label>
                </div>

                {state?.error && (
                    <p role="alert" className="px-frame animate-shake mt-5 bg-paper px-4 py-3 text-alert [--frame:var(--color-alert)]">
                        {state.error}
                    </p>
                )}

                <button disabled={pending} className="px-btn mt-6 w-full bg-alert py-4 font-pixel text-[10px] text-ink disabled:opacity-60">
                    {submit}
                </button>

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
                            {role === 'diner' ? 'New here?' : 'Own a restaurant?'}{' '}
                            <button type="button" onClick={() => switchMode('signup')} className="text-coin underline underline-offset-4 hover:text-ink">
                                {role === 'diner' ? 'Create an account' : 'Add your restaurant'}
                            </button>
                            . Demo accounts use the password in the README.
                        </>
                    )}
                </p>
            </form>

            <figure className="hidden flex-col items-center gap-4 lg:flex">
                <div className="px-frame animate-bob bg-paper p-4 [--frame:var(--color-coin)]">
                    <Image src="/images/chef.png" alt="Pixel art chef holding a plate" width={256} height={256} className="pixelated size-56" />
                </div>
                <figcaption className="px-frame bg-paper px-4 py-3 text-center [--frame:var(--color-line)]">
                    <span className="font-pixel text-[9px] text-coin">CHEF:</span>{' '}
                    {role === 'host'
                        ? creating ? 'A new restaurant! Tell me about it.' : 'Let us serve our guests!'
                        : creating ? 'A new customer! Let’s get you set up.' : 'Welcome! Grab a table.'}
                </figcaption>
            </figure>
        </div>
    );
}