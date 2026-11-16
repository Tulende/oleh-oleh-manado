'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageCircle, Send, X } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function CustomerChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Halo! Saya asisten Sentra Minahasa. Ada yang ingin ditanyakan tentang produk atau cara belanja?' },
  ]);
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, sending]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    if (content.length > 700) return;

    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setDraft('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-8) }),
      });
      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || 'Chat AI belum dapat membalas.');
      setMessages((current) => [...current, { role: 'assistant', content: data.answer! }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chat AI sedang mengalami gangguan.';
      setMessages((current) => [...current, {
        role: 'assistant',
        content: `${message} Hubungi CS WhatsApp 0812-4110-001.`,
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="Chat bantuan pelanggan"
          className="mb-3 flex h-[70vh] max-h-[520px] w-[92vw] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-stone-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Asisten Belanja</h2>
                <p className="text-[11px] text-stone-300">Sentra Minahasa</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
              className="rounded-lg p-2 text-stone-300 hover:bg-stone-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-3" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-orange-600 text-white'
                    : 'rounded-bl-md border border-stone-200 bg-white text-stone-700'
                }`}>
                  {message.content}
                </p>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Asisten sedang mengetik…
              </div>
            )}
            <div ref={endOfMessages} />
          </div>

          <form onSubmit={sendMessage} className="border-t border-stone-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={700}
                rows={2}
                placeholder="Tanya tentang produk atau belanja…"
                aria-label="Tulis pesan untuk asisten"
                className="min-h-11 flex-1 resize-none rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Kirim pesan"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-stone-400">Jangan kirim kata sandi, OTP, atau data kartu.</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Tutup chat bantuan' : 'Buka chat bantuan'}
        aria-expanded={open}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-900/25 transition hover:scale-105 hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
