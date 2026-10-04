# Rutea MDP

Aplicación PWA para gestionar y optimizar rutas de reparto en Mar del Plata. La base actual usa Next.js 16, React 19, TypeScript estricto, Prisma y Tailwind CSS.

## Estructura del proyecto

```text
.
├── prisma/
│   └── schema.prisma
├── public/
│   ├── icons/
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deliveries/route.ts
│   │   │   ├── geocode/route.ts
│   │   │   └── routes/optimize/route.ts
│   │   ├── rutas/[routeId]/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── db.ts
│   │   ├── geocoding.ts
│   │   ├── offline-db.ts
│   │   ├── routing.ts
│   │   └── whatsapp.ts
│   └── types/
│       ├── domain.ts
│       └── routing.ts
├── .env.example
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

La UI operativa está en `src/app/page.tsx`. El motor de dominio queda aislado en `src/lib`, para poder usar el mismo cálculo desde API Routes y el modo offline.

## Optimización implementada

- Geocodificación real con Nominatim, restringida a Argentina y Mar del Plata.
- TSP heurístico con nearest-neighbor y mejora 2-opt.
- Bucle completo `base → paradas → base`.
- Ventanas horarias ponderadas en la selección inicial.
- Cálculo de distancia, tiempo urbano, litros y costo en centavos.
- Validación de payloads con Zod y límites de seguridad en las API.
- Cola IndexedDB para mutaciones realizadas sin conexión.
- Service Worker y manifest para instalación como PWA.

Las ventanas horarias se priorizan en esta primera versión. Para garantizar cumplimiento estricto con llegada por horario, el siguiente paso es incorporar un solver VRPTW o una matriz de tiempos de OSRM.

## Primer arranque

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Para producción se reemplaza `DATABASE_URL` por una conexión PostgreSQL y se ejecuta `prisma migrate deploy`.
