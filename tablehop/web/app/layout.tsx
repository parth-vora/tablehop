import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';
import SiteHeader from '@/components/SiteHeader';
import './globals.css';

const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });

export const metadata: Metadata = {
    title: 'Tablehop',
    description: 'Book a table in New York, or get the next one that opens up.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={instrument.variable}>
            <body className="min-h-screen font-sans">
                <SiteHeader />
                <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">{children}</main>
            </body>
        </html>
    );
}
