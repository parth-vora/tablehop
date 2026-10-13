'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { formatTime } from '@/lib/user';
import { sfx } from '@/lib/sfx';

const suggestions = [
    'Date night for 2, somewhere romantic',
    'Cheap and quick for 4 around 7',
    'Best rated place with a table at 8',
];

type ToolPart = { type: string; state: string; input?: { guests?: number }; output?: any };

function rich(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
        chunk.startsWith('**') && chunk.endsWith('**')
            ? <strong key={i} className="font-semibold text-coin">{chunk.slice(2, -2)}</strong>
            : <Fragment key={i}>{chunk}</Fragment>,
    );
}

function Pending({ children }: { children: React.ReactNode }) {
    return (
        <p className="flex items-center gap-2 text-sm text-muted">
            <span className="animate-live size-2 bg-coin" /> {children}
        </p>
    );
}

function ToolStep({ part }: { part: ToolPart }) {
    const done = part.state === 'output-available';

    if (part.type === 'tool-listRestaurants') {
        if (!done) return <Pending>Looking through restaurants…</Pending>;
        return (
            <p className="flex items-center gap-2 text-sm text-muted">
                <span className="size-2 bg-open" /> Looked through {part.output?.length ?? 0} restaurants
            </p>
        );
    }

    if (part.type === 'tool-checkAvailability') {
        if (!done) return <Pending>Checking open tables…</Pending>;
        const o = part.output;
        if (o?.error) return null;
        const open = (o.slots ?? []).filter((s: { free: number }) => s.free > 0);
        return (
            <div className="px-frame animate-enter bg-wash p-3 [--frame:var(--color-line)]">
                <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/r/${o.restaurantId}`} className="font-medium hover:text-coin hover:underline hover:underline-offset-4">
                        {o.name}
                    </Link>
                    <span className="text-sm text-muted">party of {o.guests}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {open.slice(0, 6).map((s: { time: string }) => (
                        <Link
                            key={s.time}
                            href={`/r/${o.restaurantId}`}
                            onClick={() => sfx('select')}
                            className="px-frame bg-paper px-2 py-1 font-pixel text-[9px] [--frame:var(--color-line)] hover:[--frame:var(--color-open)]"
                        >
                            {formatTime(s.time)}
                        </Link>
                    ))}
                    {open.length === 0 && <span className="text-sm text-muted">Full tonight. Waitlist open.</span>}
                </div>
            </div>
        );
    }
    return null;
}

export default function DiningChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const { messages, sendMessage, status, stop, error } = useChat();
    const log = useRef<HTMLDivElement>(null);
    const busy = status === 'submitted' || status === 'streaming';

    useEffect(() => {
        log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
    }, [messages, status]);

    function send(text: string) {
        if (!text.trim() || busy) return;
        sfx('blip');
        sendMessage({ text });
        setInput('');
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        send(input);
    }

    return (
        <>
            {!open && (
                <button
                    onClick={() => {
                        sfx('select');
                        setOpen(true);
                    }}
                    className="px-btn animate-offer fixed right-4 bottom-4 z-40 flex items-center gap-3 bg-coin py-2 pr-4 pl-2 font-pixel text-[10px] text-void sm:right-6 sm:bottom-6"
                >
                    <Image src="/images/chef.png" alt="" width={36} height={36} className="pixelated size-9 animate-bob" />
                    Where should I eat?
                </button>
            )}

            {open && (
                <aside
                    aria-label="Dining helper"
                    className="px-panel animate-offer fixed inset-x-2 bottom-2 z-40 flex h-[min(640px,85vh)] flex-col overflow-hidden bg-paper [--frame:var(--color-coin)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]"
                >
                    <header className="flex items-center justify-between gap-4 border-b-4 border-line bg-wash px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Image src="/images/chef.png" alt="" width={40} height={40} className="pixelated size-10" />
                            <div>
                                <h2 className="font-pixel text-[10px]">Where should I eat?</h2>
                                <p className="mt-1 text-sm text-muted">Checks real open tables before it suggests anything</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                sfx('back');
                                setOpen(false);
                            }}
                            aria-label="Close"
                            className="px-btn bg-paper px-2.5 py-1.5 font-pixel text-[10px] text-ink"
                        >
                            X
                        </button>
                    </header>

                    <div ref={log} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
                        {messages.length === 0 && (
                            <div className="animate-enter">
                                <p className="px-frame bg-wash px-4 py-3 [--frame:var(--color-line)]">
                                    Tell me the vibe, party size and time, and I’ll find somewhere with a table.
                                </p>
                                <div className="mt-4 flex flex-col items-start gap-3">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => send(s)}
                                            className="group flex items-center gap-2 text-left text-coin hover:text-ink"
                                        >
                                            <span className="font-pixel text-[9px] opacity-0 group-hover:opacity-100">{'>'}</span>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m) =>
                            m.role === 'user' ? (
                                <p
                                    key={m.id}
                                    className="px-frame animate-enter ml-auto w-fit max-w-[85%] bg-coin px-4 py-2.5 text-void [--frame:var(--color-void)]"
                                >
                                    {m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}
                                </p>
                            ) : (
                                <div key={m.id} className="space-y-3">
                                    {m.parts.map((p, i) => {
                                        if (p.type === 'text') {
                                            return <p key={i} className="animate-enter whitespace-pre-wrap leading-relaxed">{rich(p.text)}</p>;
                                        }
                                        if (p.type.startsWith('tool-')) return <ToolStep key={i} part={p as unknown as ToolPart} />;
                                        return null;
                                    })}
                                </div>
                            ),
                        )}

                        {status === 'submitted' && (
                            <div aria-label="Thinking" className="flex gap-1.5">
                                {[0, 200, 400].map((d) => (
                                    <span key={d} className="animate-blink size-2 bg-coin" style={{ animationDelay: `${d}ms` }} />
                                ))}
                            </div>
                        )}
                        {error && <p className="text-alert">Something went wrong. Try asking again.</p>}
                    </div>

                    <form onSubmit={onSubmit} className="flex gap-3 border-t-4 border-line bg-wash p-3">
                        <label htmlFor="chat-input" className="sr-only">Ask about restaurants</label>
                        <input
                            id="chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Italian for 3 at 7:30?"
                            className="px-frame min-w-0 flex-1 bg-paper px-3 py-2.5 text-ink outline-none placeholder:text-muted/60 [--frame:var(--color-line)] focus:[--frame:var(--color-coin)]"
                        />
                        {busy ? (
                            <button type="button" onClick={() => stop()} className="px-btn bg-paper px-3 font-pixel text-[9px] text-ink">
                                Stop
                            </button>
                        ) : (
                            <button disabled={!input.trim()} className="px-btn bg-alert px-3 font-pixel text-[9px] text-ink disabled:bg-line disabled:text-muted">
                                Ask
                            </button>
                        )}
                    </form>
                </aside>
            )}
        </>
    );
}
