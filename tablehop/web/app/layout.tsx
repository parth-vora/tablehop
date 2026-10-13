import type { Metadata, Viewport } from 'next';
import { Pixelify_Sans, Press_Start_2P } from 'next/font/google';
import SiteHeader from '@/components/SiteHeader';
import './globals.css';

const display = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const body = Pixelify_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
    title: 'Tablehop',
    description: 'Book a table in New York, or get the next one that opens up.',
};

export const viewport: Viewport = {
    themeColor: '#17112b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${display.variable} ${body.variable}`}>
            <body className="crt min-h-screen font-sans text-[17px] leading-relaxed">
                <SiteHeader />
                <main className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">{children}</main>
            </body>
        </html>
    );
}
