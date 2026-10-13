'use client';

import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { formatTime } from '@/lib/user';

const suggestions = [
    'Date night for 2, somewhere romantic',
    'Cheap and quick for 4 around 7',
    'Best rated place with a table at 8',
];

type ToolPart = { type: string; state: string; input?: { guests?: number }; output?: any };


function rich(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
        chunk.startsWith('**') && chunk.endsWith('**')
            ? <strong key={i} className="font-semibold">{chunk.slice(2, -2)}</strong>
            : <Fragment key={i}>{chunk}</Fragment>,
    );
}

function ToolStep({ part }: { part: ToolPart }) {
    const done = part.state === 'output-available';

    if (part.type === 'tool-listRestaurants') {
        return (
            <p className="flex items-center gap-2 text-xs text-muted">
                <span className={['size-1.5 rounded-full', done ? 'bg-open' : 'animate-pulse bg-muted'].join(' ')} />
                {done ? `Looked through ${part.output?.length ?? 0} restaurants` : 'Looking through restaurants…'}
            </p>
        );
    }

    if (part.type === 'tool-checkAvailability') {
        if (!done) {
            return (
                <p className="flex items-center gap-2 text-xs text-muted">
                    <span className="size-1.5 animate-pulse rounded-full bg-muted" /> Checking open tables…
                </p>
            );
        }
        const o = part.output;
        if (o?.error) return null;
        const open = (o.slots ?? []).filter((s: { free: number }) => s.free > 0);
        return (
            <div className="animate-enter rounded-xl border border-line p-3">
                <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/r/${o.restaurantId}`} className="font-medium hover:underline hover:underline-offset-4">{o.name}</Link>
                    <span className="text-xs text-muted">party of {o.guests}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {open.slice(0, 6).map((s: { time: string }) => (
                        <Link
                            key={s.time}
                            href={`/r/${o.restaurantId}`}
                            className="rounded-md border border-line px-2 py-1 text-xs tabular-nums transition-colors hover:border-ink"
                        >
                            {formatTime(s.time)}
                        </Link>
                    ))}
                    {open.length === 0 && <span className="text-xs text-muted">Full tonight. Waitlist open.</span>}
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
                    onClick={() => setOpen(true)}
                    className="animate-offer fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-full bg-ink py-3 pr-5 pl-4 font-medium text-paper shadow-[0_8px_30px_rgb(0_0_0/0.25)] transition hover:bg-ink/85 sm:right-6 sm:bottom-6"
                >
                    <span className="animate-live size-2 rounded-full bg-[#2bd17e]" />
                    Where should I eat?
                </button>
            )}

            {open && (
                <aside
                    aria-label="Dining helper"
                    className="animate-offer fixed inset-x-2 bottom-2 z-40 flex h-[min(640px,85vh)] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_20px_60px_rgb(0_0_0/0.22)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]"
                >
                    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                        <div>
                            <h2 className="font-semibold tracking-tight">Where should I eat?</h2>
                            <p className="text-xs text-muted">Checks real open tables before it suggests anything</p>
                        </div>
                        <button onClick={() => setOpen(false)} className="rounded-full px-2 py-1 text-sm text-muted hover:bg-wash hover:text-ink">
                            Close
                        </button>
                    </header>

                    <div ref={log} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                        {messages.length === 0 && (
                            <div className="animate-enter">
                                <p className="text-[15px]">Tell me the vibe, party size and time, and I’ll find somewhere with a table.</p>
                                <div className="mt-4 flex flex-col items-start gap-2">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => send(s)}
                                            className="rounded-full border border-line px-3.5 py-2 text-left text-sm transition-colors hover:border-ink"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m) =>
                            m.role === 'user' ? (
                                <p key={m.id} className="animate-enter ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] text-paper">
                                    {m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}
                                </p>
                            ) : (
                                <div key={m.id} className="space-y-2.5">
                                    {m.parts.map((p, i) => {
                                        if (p.type === 'text') {
                                            return <p key={i} className="animate-enter whitespace-pre-wrap text-[15px] leading-relaxed">{rich(p.text)}</p>;
                                        }
                                        if (p.type.startsWith('tool-')) return <ToolStep key={i} part={p as unknown as ToolPart} />;
                                        return null;
                                    })}
                                </div>
                            ),
                        )}

                        {status === 'submitted' && (
                            <div aria-label="Thinking" className="flex gap-1">
                                {[0, 150, 300].map((d) => (
                                    <span key={d} className="size-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
                                ))}
                            </div>
                        )}
                        {error && <p className="text-sm text-alert">Something went wrong. Try asking again.</p>}
                    </div>

                    <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
                        <label htmlFor="chat-input" className="sr-only">Ask about restaurants</label>
                        <input
                            id="chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Italian for 3 at 7:30?"
                            className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-[15px] outline-none focus:border-ink"
                        />
                        {busy ? (
                            <button type="button" onClick={() => stop()} className="rounded-full border border-line px-4 text-sm font-medium">
                                Stop
                            </button>
                        ) : (
                            <button disabled={!input.trim()} className="rounded-full bg-ink px-4 text-sm font-medium text-paper disabled:bg-line disabled:text-muted">
                                Ask
                            </button>
                        )}
                    </form>
                </aside>
            )}
        </>
    );
}
