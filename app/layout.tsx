import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
// import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Statistical Analysis Tool',
  description: 'Advanced statistical analysis web application'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const [theme, setTheme] = useState('system');

  // const toggleTheme = () => {
  //   setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  // };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* <ThemeProvider
          attribute="class"
          defaultTheme={theme}
          enableSystem
          disableTransitionOnChange
        >
          <button onClick={toggleTheme}>Toggle Theme</button> */}
        {children}
        <Toaster />
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
