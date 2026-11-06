import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GST-PLANOS 3D — Estudio CAD Paramétrico | GST-SOFTWARE',
  description:
    'Generador de planos en 3D con cotas y despiece para techos, mesas, muebles de cocina, closets, puertas y marcos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
