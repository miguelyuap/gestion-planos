import React from 'react';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white">
      <div className="max-w-2xl space-y-6">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950 rounded-full border border-blue-800">
          GST-SOFTWARE Factory Standard
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Nuevo Producto SaaS GST
        </h1>
        <p className="text-slate-400 text-lg">
          Proyecto inicializado con éxito a partir de la plantilla oficial <code className="text-blue-300">gst-template-nextjs</code>.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <a
            href="https://gstsoftware.com"
            className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Documentación de Plataforma
          </a>
        </div>
      </div>
    </main>
  );
}
