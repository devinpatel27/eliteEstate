import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { StoreProvider } from '@/components/providers/StoreProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { UserThemeSync } from '@/components/providers/UserThemeSync';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Elite Estate CRM',
  description: 'Enterprise Real Estate CRM System',
  icons: {
    icon: '/elite-estate-logo.png',
    shortcut: '/elite-estate-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="crm-theme-active"
          disableTransitionOnChange
        >
          <StoreProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </StoreProvider>
          <UserThemeSync />
          <div id="crm-datepicker-root" />
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
