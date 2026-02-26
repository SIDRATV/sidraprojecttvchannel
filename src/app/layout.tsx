import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sidra Project TV Channel | Premium Islamic Media Streaming',
  description:
    'Experience premium Islamic media showcasing innovative projects within the Sidra ecosystem. Documentaries, tutorials, and inspirational content.',
  keywords: [
    'Islamic media',
    'Streaming platform',
    'Documentary',
    'Sidra ecosystem',
    'Premium content',
  ],
  authors: [{ name: 'Sidra Project' }],
  creator: 'Sidra Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sidra.tv',
    title: 'Sidra Project TV Channel',
    description: 'Premium Islamic media streaming platform',
    siteName: 'Sidra TV',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a1a2e" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme ? theme === 'dark' : prefersDark;
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-950 dark:text-white transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
