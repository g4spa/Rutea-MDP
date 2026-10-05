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
│   │   ├── clientes/page.tsx
│   │   ├── historico/page.tsx
│   │   ├── historico/[routeId]/page.tsx
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

La UI operativa está en `src/app/page.tsx`. Las superficies CRM e histórico ya están creadas en `/clientes` y `/historico`; el motor de dominio queda aislado en `src/lib`, para poder usar el mismo cálculo desde API Routes y el modo offline.

## Modelo de datos actual

`schema.prisma` contempla:

- Ficha CRM completa: CUIT, condición fiscal, facturación, contacto, geocodificación, superficie vial, estacionamiento medido, horarios, notas y cuenta corriente.
- Rutas con métricas estimadas/reales, conductor, estado, caja, gastos y cierre histórico.
- Entregas con secuencia, estados de incidencia, horarios reales, devoluciones y mercadería dañada.
- Pagos, gastos en ruta, picking de salida, balances de cajones/envases y prueba de entrega.
- `RouteHistory` para métricas consolidadas y `AuditLog` para trazabilidad de cambios.

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

El optimizador usa OSRM Table Service para construir costos de viaje por red vial (`duration` y `distance`) y OSRM Route Service para obtener la geometría GeoJSON real. El formato enviado a OSRM es siempre `longitud,latitud`; si OSRM no responde o no encuentra un recorrido, la API devuelve `502` y no inventa una ruta en línea recta.

## Primer arranque

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Para producción se reemplaza `DATABASE_URL` por una conexión PostgreSQL y se ejecuta `prisma migrate deploy`.

## Probar desde un teléfono con datos móviles

La aplicación usa rutas relativas (`/api/...`), por lo que el frontend funciona desde el dominio HTTPS del túnel sin cambiar URLs a `localhost`.

### Opción recomendada: Cloudflare Quick Tunnel

Instalar `cloudflared` en Windows con WinGet:

```powershell
winget install --id Cloudflare.cloudflared
```

Alternativamente, con Chocolatey:

```powershell
choco install cloudflared
```

Abrir dos terminales en la raíz del proyecto:

**Terminal 1 - Next.js:**

```powershell
npm run dev:public
```

**Terminal 2 - túnel HTTPS:**

```powershell
npm run tunnel
```

`cloudflared` mostrará una línea similar a:

```text
INF Your quick Tunnel has been created! Visit it at https://random-name.trycloudflare.com
```

Abrí esa URL `https://...trycloudflare.com` desde el navegador del teléfono usando 4G/5G. No cierres ninguna de las dos terminales mientras estés probando.

### Alternativa: ngrok

```powershell
winget install --id Ngrok.Ngrok
ngrok config add-authtoken TU_TOKEN
```

Luego:

```powershell
# Terminal 1
npm run dev:public

# Terminal 2
npm run tunnel:ngrok
```

Usá la URL `Forwarding https://...ngrok-free.app -> http://localhost:3000` que imprime ngrok.

### Verificación rápida

Antes de abrirlo en el teléfono, verificá en la PC:

```powershell
Invoke-WebRequest http://localhost:3000
```

Debe responder `200`. Si el túnel arranca pero la página no carga, confirmá que Next.js siga ejecutándose en la Terminal 1 y que estés usando la URL HTTPS, no `localhost`.
