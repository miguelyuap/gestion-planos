# GST-SOFTWARE — Next.js Starter Template

Plantilla starter oficial de **GST-SOFTWARE** para la creación de nuevas aplicaciones SaaS y plataformas web fullstack.

---

## 🛠️ Stack Incluido

- **Framework:** Next.js (App Router) + React 19 + TypeScript.
- **Estilos:** Tailwind CSS + Lucide Icons.
- **Backend & Auth:** Supabase (`@supabase/ssr`).
- **Validaciones:** Zod.
- **Testing:** Vitest.
- **Calidad & Linter:** ESLint + TypeScript Strict Mode.
- **Asistencia IA:** Directivas de Antigravity preconfiguradas en `.gemini/rules`.

---

## 📁 Estructura del Proyecto

```text
├── .gemini/rules             # Reglas automáticas de Antigravity IA
├── .gitlab-ci.yml            # Pipeline preconfigurado de CI/CD
├── src/
│   ├── app/                  # Next.js App Router (Layouts, Páginas, API routes)
│   ├── components/           # Componentes UI reutilizables
│   │   └── ui/               # Botones, Inputs, Modales base
│   ├── lib/                  # Integración Supabase (client.ts / server.ts)
│   ├── modules/              # Módulos de dominio (Auth, Dashboard, Clientes)
│   └── types/                # Interfaces TypeScript globales
└── public/                   # Activos estáticos
```

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Validar calidad de código antes de commit
npm run typecheck
npm run lint
npm run test
```
