import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GST-SOFTWARE — Starter Product',
  description: 'Producto desarrollado bajo los estándares oficiales de GST-SOFTWARE',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
