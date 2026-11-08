# SmartCart: guía de construcción para agentes de IA

> Este archivo es la fuente de verdad para Codex, Claude Code o cualquier agente que construya SmartCart.
> Cópialo en la raíz del repositorio como `AGENTS.md` (Codex) y como `CLAUDE.md` (Claude Code). Si prefieres un solo archivo, deja en `CLAUDE.md` únicamente la línea `@AGENTS.md`.
> Idioma: la documentación, los mensajes de commit y los textos de la interfaz van en español de Guatemala. El código (nombres de clases, variables, rutas) va en inglés.

---

## 0. Cómo debes trabajar (léelo primero)

El desarrollador (José Julián) trabaja desde Visual Studio Code, aprueba cada paso y prueba la aplicación él mismo. Por eso:

1. **Una tarea a la vez.** Las tareas están numeradas (T01, T02...) en la sección 12. Haz solo la que se te pida o la siguiente pendiente.
2. **Antes de escribir código, resume en 5 líneas o menos qué vas a hacer** y qué archivos tocarás. Espera aprobación si la tarea instala dependencias, cambia el esquema de la base de datos o borra archivos.
3. **Nunca** ejecutes `migrate:fresh`, `db:wipe` ni borres datos sin pedir permiso explícito.
4. **Cada tarea termina con:** pruebas en verde, instrucciones breves para probar a mano (URL, usuario, pasos) y un commit.
5. **Commits** en español, formato convencional: `feat(cart): agrega escaneo por código de barras`. Un commit por tarea.
6. **No inventes** endpoints, columnas ni pantallas que no estén en esta guía. Si falta algo, pregunta o propón una opción y espera respuesta.
7. **No agregues dependencias** fuera de las listadas sin proponerlo primero con su justificación.
8. **Secretos:** nunca los pongas en el repositorio. Todo va en `.env`; mantén `.env.example` actualizado.
9. Si una prueba falla, **diagnostica la causa** antes de cambiar la prueba. No debilites pruebas para que pasen.
10. Al terminar cada tarea, actualiza la casilla correspondiente en la sección 12 y anota decisiones nuevas en la sección 13.

---

## 1. Contexto del producto

**SmartCart** es un carrito de compras inteligente para supermercados de Guatemala. Una tablet (o dispositivo dedicado en modo quiosco) montada en el carrito muestra una aplicación que:

- identifica al cliente por QR de la app del súper o como invitado,
- recibe códigos de barras desde un lector Bluetooth,
- muestra la lista de productos, cantidades y el total en tiempo real,
- avisa cuando el cliente se acerca a su presupuesto,
- sugiere ofertas,
- resume la compra con IVA incluido y factura a Consumidor final o NIT,
- simula el pago y entrega un código de salida con revisión aleatoria.

**Es una demostración universitaria** (Administración de Empresas, UVG Campus Sur). No se conecta a un supermercado real. El objetivo es una demo estable y visualmente pulida, con arquitectura limpia que pueda crecer.

### 1.1 Qué es real y qué es simulado

| Elemento | Estado en la demo |
|---|---|
| Autenticación JWT (invitado, QR, admin) | Real |
| Catálogo, carrito, totales, presupuesto, ofertas | Real, con base de datos |
| Lector de códigos de barras | Hardware real Bluetooth (modo teclado), **más** un panel de simulación |
| Pago con tarjeta | **Simulado** (siempre aprueba, salvo escenario de fallo configurable) |
| Factura electrónica FEL (SAT) | **Simulada**: solo se guarda NIT o CF y se muestra un resumen |
| Conexión con sistema de caja del súper | Fuera de alcance |

> Importante: en la presentación **no se escaneará en vivo**. El flujo se recorre con el panel de simulación (sección 8.4). El lector físico solo debe verse conectado e instalado.

### 1.2 Referencia visual

El diseño de las seis pantallas está en `docs/design/diseno_smartcart.html` (abrir en el navegador) y exportado como `docs/design/screen1.png` a `screen6.png`. **Replica ese diseño** con React y Tailwind. Si algo del diseño choca con esta guía, avisa antes de decidir.

---

## 2. Stack tecnológico

| Capa | Tecnología | Nota |
|---|---|---|
| Servidor local | **Laravel Herd** | Sirve el backend en `https://smartcart-api.test` |
| Backend | **Laravel 12**, PHP 8.3 o superior | API REST JSON, sin vistas Blade |
| Base de datos | **MariaDB 11** | Driver `mariadb` de Laravel, `utf8mb4`. Se administra con **HeidiSQL** |
| Autenticación | **JWT** con `php-open-source-saver/jwt-auth` | Tokens de acceso cortos y refresh |
| Frontend | **React 19 + TypeScript + Vite** | SPA independiente en `frontend/` |
| Estilos | **Tailwind CSS v4** | Tokens de diseño en la sección 9 |
| Estado del servidor | **TanStack Query** | Caché y reintentos |
| Estado local de UI | **Zustand** | Pantalla activa, panel de simulación |
| Enrutamiento | **React Router** | |
| Pruebas backend | **Pest** (sobre PHPUnit) | |
| Pruebas frontend | **Vitest + Testing Library** | |
| Prueba de flujo completo | **Playwright** (una prueba del recorrido de demo) | |
| Calidad | Laravel Pint, ESLint, Prettier, `tsc --noEmit` | |

### 2.1 Estructura del repositorio

```
smartcart/
├── AGENTS.md / CLAUDE.md
├── docs/
│   └── design/                 # diseno_smartcart.html y screen1..6.png
├── backend/                    # proyecto Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   ├── Http/Requests/
│   │   ├── Http/Resources/
│   │   ├── Models/
│   │   ├── Services/           # CartService, PricingService, PromotionService, CheckoutService
│   │   ├── Policies/
│   │   └── Support/Ean13.php
│   ├── database/{migrations,seeders,factories}
│   ├── routes/api.php
│   └── tests/{Feature,Unit}
└── frontend/                   # proyecto Vite + React
    └── src/
        ├── api/                # cliente HTTP, hooks de TanStack Query
        ├── features/{auth,cart,offers,checkout,exit,simulation,admin}/
        ├── components/         # Button, Chip, Card, DonutProgress, ProductThumb...
        ├── hooks/useBarcodeScanner.ts
        ├── lib/{money.ts,ean13.ts}
        ├── routes/
        └── styles/tokens.css
```

### 2.2 Configuración local con Herd y HeidiSQL

1. Instala PHP 8.3+ y Composer con Herd. En la carpeta `backend/` ejecuta `herd link smartcart-api` para obtener `https://smartcart-api.test`. Si usas HTTPS local, `herd secure`.
2. Crea la base `smartcart` en MariaDB desde HeidiSQL (cotejamiento `utf8mb4_unicode_ci`) y un usuario `smartcart` con permisos solo sobre esa base.
3. `.env` del backend:

```
APP_NAME=SmartCart
APP_URL=https://smartcart-api.test
FRONTEND_URL=http://localhost:5173
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smartcart
DB_USERNAME=smartcart
DB_PASSWORD=
JWT_SECRET=            # se genera con php artisan jwt:secret
JWT_TTL=30             # minutos del token de acceso
JWT_REFRESH_TTL=720    # minutos para refrescar (12 horas)
DEMO_MODE=true
EXIT_CHECK_PROBABILITY=0.2
CART_BUDGET_WARN=0.8
```

4. `.env` del frontend: `VITE_API_URL=https://smartcart-api.test/api/v1` y `VITE_DEMO_MODE=true`.
5. Backend: `composer install`, `php artisan key:generate`, `php artisan jwt:secret`, `php artisan migrate --seed`. Frontend: `npm install`, `npm run dev` (puerto 5173).
6. CORS: permitir únicamente `FRONTEND_URL` en `config/cors.php`.

---

## 3. Requisitos

### 3.1 Funcionales

- **RF01** Iniciar compra como invitado.
- **RF02** Iniciar compra con QR de la app (en la demo el QR contiene un código de cliente de prueba).
- **RF03** Escanear un código de barras EAN-13 y agregar el producto al carrito. Si ya existe, suma cantidad.
- **RF04** Mostrar lista con imagen, nombre, categoría, precio unitario, cantidad y subtotal por línea.
- **RF05** Cambiar cantidad (+/-) y eliminar un producto.
- **RF06** Mostrar total actualizado con IVA incluido (12 %).
- **RF07** Definir un presupuesto y alertar al llegar al 80 % y al 100 %.
- **RF08** Mostrar ofertas relacionadas con lo que hay en el carrito y permitir agregarlas.
- **RF09** Resumen de compra con subtotal, IVA y total; factura a CF o NIT.
- **RF10** Pago simulado con tarjeta o "caja rápida".
- **RF11** Generar código de salida y decidir si corresponde revisión aleatoria.
- **RF12** Panel de simulación de escaneo para la demo.
- **RF13** Panel de administración mínimo: productos, ofertas y compras recientes.

### 3.2 No funcionales

- **Rendimiento:** la respuesta de `POST /scan` debe ser menor a 300 ms en local.
- **Usabilidad táctil:** botones de al menos 56 px de alto, texto base de 20 px o más, contraste AA.
- **Resolución objetivo:** tablet horizontal 1280x800. Debe verse bien también a 1024x768.
- **Robustez:** el carrito sobrevive a recargar la página (el estado vive en el servidor).
- **Seguridad:** JWT, validación en el servidor, autorización por sesión de compra, limitación de tasa.
- **Mantenibilidad:** lógica de negocio en servicios, controladores delgados, cobertura de pruebas en reglas de negocio.

### 3.3 Fuera de alcance

Escaneo real en la presentación, productos por peso, modo sin conexión, integración con POS o catálogo real, pagos reales, facturación FEL real, multi sucursal, notificaciones push, app móvil.

---

## 4. Arquitectura de alto nivel

```
 Lector Bluetooth (teclado HID)        Panel de simulación (demo)
          │ teclas + Enter                      │ clic
          ▼                                     ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Frontend React (Vite)  http://localhost:5173           │
 │  useBarcodeScanner ─► api/client (Bearer JWT)           │
 │  TanStack Query ◄─► Zustand (UI)                        │
 └──────────────────────────┬──────────────────────────────┘
                            │ HTTPS JSON /api/v1
                            ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Laravel 12 (Herd)  https://smartcart-api.test          │
 │  Middleware: CORS, throttle, auth:api (JWT)             │
 │  Controllers ─► FormRequests ─► Services ─► Models      │
 │  CartService  PricingService  PromotionService          │
 │  CheckoutService  (pago y FEL simulados)                │
 └──────────────────────────┬──────────────────────────────┘
                            │ Eloquent / PDO
                            ▼
                   MariaDB 11 (HeidiSQL para inspección)
```

**Decisiones clave** (detalle y trade-offs en la sección 13):

- SPA React separada del backend, comunicada por API REST con JWT.
- El **servidor** calcula todos los totales. El frontend solo muestra.
- El estado del carrito vive en la base de datos, no en el navegador.
- Sin WebSockets: un solo cliente por carrito, basta con invalidar la caché tras cada acción.

---

## 5. Modelo de datos (MariaDB)

Dinero siempre en `DECIMAL(10,2)` (quetzales). Todas las tablas con `id` BIGINT, `created_at`, `updated_at`. Claves foráneas con índice. Motor InnoDB, `utf8mb4`.

| Tabla | Columnas principales | Reglas |
|---|---|---|
| `users` | name, email (único, nullable), password (nullable), role (`customer`, `guest`, `admin`), qr_code (único, nullable), nit (nullable) | Invitados se crean con `role=guest` y sin email |
| `devices` | code (único, ej. `CART-07`), name, last_seen_at, active | Identifica el carrito físico |
| `categories` | name (único), color_hex, emoji | Categorías del diseño |
| `products` | category_id, barcode (único, CHAR 13), name, description, price, image_emoji, image_url (nullable), active, stock (nullable) | Índice único en `barcode` |
| `promotions` | product_id, promo_price, label, starts_at, ends_at, active | Precio de oferta por producto |
| `shopping_sessions` | user_id, device_id, status (`active`, `checkout`, `paid`, `cancelled`), budget (nullable), started_at, finished_at | Un usuario solo puede tener una sesión `active` por dispositivo |
| `cart_items` | shopping_session_id, product_id, quantity, unit_price, promo_applied (bool) | Único `(shopping_session_id, product_id)`. El precio se congela al agregar |
| `scan_events` | shopping_session_id, barcode, result (`added`, `incremented`, `not_found`, `invalid`), source (`reader`, `simulation`), created_at | Auditoría y métricas |
| `orders` | shopping_session_id (único), invoice_type (`CF`, `NIT`), nit, subtotal, vat, total, payment_method, status, requires_check (bool), exit_code (único) | Se crea al pagar |
| `order_items` | order_id, product_id, name_snapshot, unit_price, quantity, line_total | Foto de la compra |
| `payments` | order_id, method (`card`, `fast_checkout`), status, simulated (bool, true), reference | Pago simulado |

Relaciones: `User 1-N ShoppingSession`, `ShoppingSession 1-N CartItem`, `Product 1-N Promotion`, `ShoppingSession 1-1 Order`, `Order 1-N OrderItem`, `Order 1-1 Payment`.

### 5.1 Catálogo de prueba (seeder)

Prefijo `740` (GS1 Guatemala). Los 20 productos de la demo, con EAN-13 válidos:

| # | Código de barras | Producto | Categoría | Precio |
|---|---|---|---|---|
| 1 | 7401000000015 | Leche entera 1 litro | Lácteos | Q11.75 |
| 2 | 7401000000022 | Queso fresco 400 g | Lácteos | Q28.00 |
| 3 | 7401000000039 | Mantequilla 250 g | Lácteos | Q15.50 |
| 4 | 7401000000046 | Pan de caja | Panadería | Q18.50 |
| 5 | 7401000000053 | Tortillas de maíz 1 libra | Panadería | Q6.00 |
| 6 | 7401000000060 | Gaseosa 2 litros | Bebidas | Q14.00 |
| 7 | 7401000000077 | Jugo de naranja 1 litro | Bebidas | Q15.00 |
| 8 | 7401000000084 | Agua pura 600 ml | Bebidas | Q5.00 |
| 9 | 7401000000091 | Café molido 400 g | Despensa | Q38.00 |
| 10 | 7401000000107 | Huevos docena | Frescos | Q26.00 |
| 11 | 7401000000114 | Frijol negro volteado en lata | Despensa | Q15.00 |
| 12 | 7401000000121 | Arroz 2 libras | Despensa | Q14.50 |
| 13 | 7401000000138 | Azúcar 2 libras | Despensa | Q12.00 |
| 14 | 7401000000145 | Aceite vegetal 1 litro | Despensa | Q29.00 |
| 15 | 7401000000152 | Espagueti 400 g | Despensa | Q8.50 |
| 16 | 7401000000169 | Cereal de avena 500 g | Despensa | Q20.00 |
| 17 | 7401000000176 | Galletas de soda | Despensa | Q9.00 |
| 18 | 7401000000183 | Papel higiénico 4 rollos | Hogar | Q22.00 |
| 19 | 7401000000190 | Detergente en polvo 1 kg | Hogar | Q25.00 |
| 20 | 7401000000206 | Champú 400 ml | Cuidado personal | Q34.00 |

Emojis sugeridos para la imagen: 🥛 🧀 🧈 🍞 🫓 🥤 🧃 💧 ☕ 🥚 🥫 🍚 🍬 🫗 🍝 🥣 🍪 🧻 🧼 🧴.

**Ofertas iniciales:** Cereal de avena Q16.00 (antes Q20.00), Mantequilla Q13.50 (antes Q15.50), Jugo de naranja Q15.00 con etiqueta "2x1 en la segunda unidad" solo informativa.

**Usuarios semilla:** `admin@smartcart.test` (rol admin, contraseña definida por variable de entorno, nunca en el código) y un cliente demo con `qr_code = SC-DEMO-0001`.

---

## 6. Diseño de la API (REST, prefijo `/api/v1`)

Respuestas JSON con Eloquent API Resources. Errores en formato `{ "message": "...", "errors": { ... } }` con el código HTTP correcto. Mensajes de error en español.

### 6.1 Autenticación

| Método y ruta | Descripción | Auth |
|---|---|---|
| `POST /auth/guest` | Crea usuario invitado y devuelve JWT. Body: `device_code` | No |
| `POST /auth/qr` | Intercambia `qr_code` por JWT de cliente. Body: `qr_code`, `device_code` | No |
| `POST /auth/login` | Email y contraseña (admin). Limitar a 5 intentos por minuto | No |
| `POST /auth/refresh` | Renueva el token mientras esté dentro de `JWT_REFRESH_TTL` | Bearer |
| `POST /auth/logout` | Invalida el token | Bearer |
| `GET /auth/me` | Datos del usuario | Bearer |

Respuesta de autenticación: `{ "access_token", "token_type": "bearer", "expires_in", "user": {...} }`.
Claims personalizados: `role`, `device` (código del carrito).

### 6.2 Compra

| Método y ruta | Descripción |
|---|---|
| `POST /sessions` | Inicia sesión de compra (o devuelve la activa). Body opcional: `budget` |
| `GET /sessions/current` | Sesión activa con ítems, totales y estado de presupuesto |
| `PUT /sessions/current/budget` | Define o cambia el presupuesto |
| `POST /sessions/current/scan` | Body: `barcode`, `source` (`reader` o `simulation`). Agrega o incrementa |
| `PATCH /sessions/current/items/{item}` | Body: `quantity` (1 a 99) |
| `DELETE /sessions/current/items/{item}` | Elimina la línea |
| `GET /sessions/current/offers` | Hasta 3 ofertas relacionadas |
| `POST /sessions/current/offers/{promotion}/add` | Agrega el producto en oferta |
| `GET /sessions/current/summary` | Subtotal, IVA, total, ítems |
| `POST /sessions/current/checkout` | Body: `invoice_type` (`CF` o `NIT`), `nit` (si NIT), `payment_method`. Crea orden y pago simulado |
| `GET /orders/{order}/exit` | Código de salida y `requires_check` |

Forma de la sesión en las respuestas:

```json
{
  "id": 12,
  "status": "active",
  "items": [
    { "id": 1, "product": { "name": "Leche entera 1 litro", "category": "Lácteos", "emoji": "🥛" },
      "quantity": 1, "unit_price": "11.75", "line_total": "11.75", "promo_applied": false, "is_new": false }
  ],
  "totals": { "items_count": 4, "subtotal": "62.72", "vat": "7.53", "total": "70.25" },
  "budget": { "amount": "100.00", "used_percent": 70, "remaining": "29.75", "level": "ok" }
}
```

`budget.level`: `none`, `ok`, `warning` (≥ 80 %), `exceeded` (≥ 100 %). `is_new` es verdadero solo para la línea tocada por el último escaneo.

Respuesta de `/scan` incluye la sesión actualizada y `scan: { result, message }`. Códigos de error: `422` código inválido (longitud o dígito verificador), `404` producto inexistente o inactivo con mensaje "Este producto no está en el catálogo".

### 6.3 Administración (rol `admin`)

`GET/POST/PUT/DELETE /admin/products`, `GET/POST/PUT/DELETE /admin/promotions`, `GET /admin/orders` (paginado), `GET /admin/stats` (compras del día, ticket promedio, productos más escaneados).

---

## 7. Reglas de negocio

1. **EAN-13:** 13 dígitos numéricos y dígito verificador correcto (`Ean13::isValid`). Se valida igual en backend y frontend.
2. **Precio vigente:** si hay una promoción activa en la fecha actual, se usa `promo_price` y se marca `promo_applied = true`. El precio queda congelado en `cart_items.unit_price`.
3. **Escaneo repetido:** suma 1 a la cantidad. Máximo 99 por línea.
4. **IVA:** los precios ya incluyen 12 %. `vat = total * 12 / 112`, `subtotal = total - vat`, redondeo a 2 decimales con `round half up`. Todo en `PricingService`, con pruebas unitarias.
5. **Presupuesto:** `used_percent = floor(total / budget * 100)`. `warning` desde `CART_BUDGET_WARN`, `exceeded` desde 100 %. Superar el presupuesto **no bloquea** el pago, solo avisa.
6. **Una sesión activa por dispositivo.** Al iniciar otra, la anterior se cancela.
7. **Pago simulado:** `card` aprueba siempre, excepto si `DEMO_FAIL_NEXT_PAYMENT=true` (para demostrar un error). `fast_checkout` genera el código y marca la orden como pendiente de caja.
8. **Revisión aleatoria:** `requires_check = random() < EXIT_CHECK_PROBABILITY`. En modo demo se puede forzar con el panel de simulación.
9. **NIT:** validar formato guatemalteco con el algoritmo de dígito verificador del NIT (módulo 11) y aceptar `CF`. No se consulta a la SAT.
   Para la demo se quitan guion y espacios, se toma el último dígito como verificador, se multiplican los dígitos restantes por pesos descendentes desde `n+1` hasta `2`, se calcula `11 - (suma % 11)` y se reduce 11 a 0. Ejemplos calculados: base `123456` produce `123456-0`; `123456-9` es inválido.
10. **Una orden por sesión.** Después de pagar, la sesión pasa a `paid` y no admite cambios.
11. **Autorización:** un usuario solo accede a su propia sesión. Policies y pruebas que lo demuestren.

---

## 8. Frontend

### 8.1 Pantallas y rutas

| Ruta | Pantalla (diseño) | Contenido clave |
|---|---|---|
| `/` | 1. Inicio | Botón QR, botón invitado, QR y pasos |
| `/cart` | 2. Carrito | Franja del lector, lista de tarjetas, total, anillo de presupuesto, ir a pagar |
| `/cart` (modal) | 3. Alerta de presupuesto | Se muestra al cruzar 80 % o 100 %, una vez por umbral |
| `/offers` | 4. Ofertas | Hasta 3 tarjetas con ahorro y botón Agregar |
| `/checkout` | 5. Resumen y pago | Lista resumida, totales, factura, métodos de pago |
| `/exit` | 6. Salida | Confirmación, código QR de salida, aviso de revisión |
| `/admin` | Administración | Productos, ofertas, compras (sin diseño de mockup, usa los mismos componentes) |

### 8.2 Componentes reutilizables

`Button` (variantes primary, secondary, amber, blue), `Chip`, `Card`, `TopBar` (logo, carrito, estado del lector, usuario), `CartLine` (tarjeta con emoji, categoría, selector de cantidad, eliminar), `DonutProgress`, `OfferCard`, `PaymentOption`, `QrCode` (librería `qrcode.react`), `ProductThumb`, `Toast`.

### 8.3 Lector de códigos de barras (hook `useBarcodeScanner`)

Los lectores Bluetooth en modo HID escriben como teclado y terminan con Enter.

- Escuchar `keydown` en `window`, acumular caracteres en un buffer.
- Un escaneo es válido si llegan 8 o más caracteres con menos de 50 ms entre teclas y termina en `Enter`. Así se distingue de alguien que teclea.
- Ignorar el buffer si el foco está en un `input` de texto (por ejemplo el campo NIT).
- Al completar, validar con `ean13.ts` y llamar a `POST /scan` con `source: "reader"`.
- Mostrar en la franja del lector: "Lector listo", "Leyendo..." y errores ("Código no reconocido").
- El indicador "Lector conectado" es visual en la demo (estado configurable). No existe API web fiable para saber si un HID Bluetooth está emparejado.

### 8.4 Panel de simulación (clave para la presentación)

Visible solo si `VITE_DEMO_MODE=true`. Se abre con `Ctrl + Shift + D` o con un botón discreto en la esquina inferior derecha.

- Cuadrícula de los 20 productos; cada botón llama a `POST /scan` con `source: "simulation"`.
- Botón **Escenario completo**: agrega 4 productos con pausa de 1.2 s entre cada uno para mostrar la lista creciendo.
- Botones: "Definir presupuesto Q100", "Forzar revisión aleatoria", "Forzar fallo de pago", "Reiniciar demo" (cancela la sesión y vuelve al inicio).
- No debe aparecer en capturas del producto final cuando `VITE_DEMO_MODE=false`.

### 8.5 Gestión de sesión y tokens

- Guardar el token en `sessionStorage` (se pierde al cerrar la pestaña, adecuado para quiosco). Documenta en `docs/seguridad.md` el riesgo XSS frente a cookies HttpOnly.
- Interceptor HTTP: agrega `Authorization: Bearer`, y ante `401` intenta `POST /auth/refresh` una sola vez; si falla, regresa a `/`.
- Rutas protegidas con un guardián que revisa el rol.
- Inactividad: tras 3 minutos sin interacción en `/cart` mostrar aviso, a los 5 minutos volver al inicio si la compra está vacía.

### 8.6 Estados que cada pantalla debe cubrir

Carga (esqueletos, no spinners a pantalla completa), vacío ("Tu carrito está vacío, escanea tu primer producto"), error de red (mensaje y botón Reintentar), producto no encontrado, límite de cantidad alcanzado.

---

## 9. Tokens de diseño (Tailwind v4, `styles/tokens.css`)

```css
@import "tailwindcss";
@theme {
  --color-brand-50:  #f0fdfa;
  --color-brand-100: #ccfbf1;
  --color-brand-400: #2dd4bf;
  --color-brand-500: #14b8a6;
  --color-brand-700: #0f766e;
  --color-brand-800: #115e59;
  --color-amber-500: #f59e0b;
  --color-amber-600: #d97706;
  --color-blue-500:  #3b82f6;
  --color-blue-700:  #1d4ed8;
  --color-ok:        #22c55e;
  --color-danger:    #e11d48;
  --color-ink:       #0f172a;
  --color-muted:     #64748b;
  --color-surface:   #f1f5f9;
  --font-sans: Calibri, Carlito, "Segoe UI", system-ui, sans-serif;
  --radius-card: 22px;
  --radius-btn: 20px;
}
```

Reglas: botones con relieve inferior (sombra de 8 px más oscura), tarjetas blancas con sombra suave, chips redondos, iconos de línea de 2 px (usar `lucide-react`), emojis para imagen de producto, tipografía grande legible a un brazo de distancia. Mismo estilo en las seis pantallas.

---

## 10. Estrategia de pruebas

| Nivel | Qué cubre | Herramienta |
|---|---|---|
| Unitarias backend | `Ean13`, `PricingService` (IVA y redondeo), `PromotionService`, validación de NIT | Pest |
| Feature backend | Cada endpoint: caso feliz, validación, autorización, límite de tasa, escaneo repetido, presupuesto en 80 % y 100 %, pago, código de salida | Pest + base de datos de pruebas |
| Unitarias frontend | `ean13.ts`, `money.ts`, `useBarcodeScanner` (con temporizadores falsos), `DonutProgress` | Vitest |
| Componentes | `CartLine`, alerta de presupuesto, estados vacío y error | Testing Library |
| Extremo a extremo | **Un** recorrido: inicio como invitado, escanear 4 productos con simulación, alerta, ofertas, pago, salida | Playwright |

Reglas: base de datos de pruebas separada (`smartcart_test`), `RefreshDatabase`, factories para todo, ninguna prueba depende de datos de otra. Criterio mínimo: reglas de negocio con cobertura alta, sin perseguir un porcentaje global.

Comandos: `php artisan test`, `./vendor/bin/pint --test`, `npm run test`, `npm run lint`, `npx tsc --noEmit`, `npx playwright test`.

---

## 11. Seguridad y calidad

- Validación con `FormRequest` en cada endpoint. Nunca confiar en precios ni totales enviados por el cliente.
- `throttle` general de 120 solicitudes por minuto y 5 por minuto en login.
- JWT con algoritmo HS256 y `JWT_SECRET` largo. Lista de invalidación habilitada para `logout`.
- Contraseñas con `Hash::make` (bcrypt o argon2 por defecto de Laravel).
- CORS limitado al origen del frontend. Sin `*`.
- No registrar tokens ni contraseñas en logs.
- Datos personales mínimos: en el producto real, tratarlos con consentimiento y solo para la compra.
- Cabeceras de seguridad básicas y `APP_DEBUG=false` fuera de local.
- Dependencias: ejecutar `composer audit` y `npm audit` antes de cerrar cada sprint.

---

## 12. Plan de sprints y tareas

Supuestos: trabajan el desarrollador y el agente; el agente produce, el desarrollador aprueba y prueba. Sprints de **dos semanas**. Tamaños: **S** (menos de 1 hora), **M** (1 a 3 horas), **L** (media jornada). Cada tarea tiene criterios de aceptación; no se da por terminada si no se cumplen.

### Sprint 0: preparación (1 a 2 días)

- [x] **T01 (M) Repositorio y esqueleto.** Crea `backend/` (Laravel 12) y `frontend/` (Vite React TS), `.gitignore`, `README.md` con pasos de instalación, copia de esta guía como `AGENTS.md` y `CLAUDE.md`.
  *Aceptación:* `https://smartcart-api.test/up` responde 200; `npm run dev` abre una página en blanco con Tailwind activo.
- [x] **T02 (S) Base de datos.** Configura `.env` para MariaDB, crea `smartcart` y `smartcart_test`, verifica con `php artisan migrate:status`.
  *Aceptación:* conexión confirmada desde HeidiSQL y desde Laravel.
- [x] **T03 (S) Calidad.** Instala Pest, Pint, ESLint, Prettier y Vitest con un test de ejemplo en cada lado.
  *Aceptación:* todos los comandos de la sección 10 corren en verde.

### Sprint 1: backend base (semanas 1 y 2)

Meta: API de compra completa y probada, sin interfaz.

- [x] **T04 (L) Migraciones y modelos** de la sección 5, relaciones, factories y casts de dinero.
  *Aceptación:* `migrate` crea todas las tablas con índices y claves foráneas; el diagrama coincide en HeidiSQL.
- [x] **T05 (M) Seeders:** categorías, dispositivo, 20 productos, ofertas, admin y cliente demo (sección 5.1).
  *Aceptación:* `migrate --seed` es repetible y todos los EAN pasan `Ean13::isValid`.
- [x] **T06 (M) `Ean13` y `PricingService`** con pruebas unitarias (incluye casos de redondeo del IVA).
  *Aceptación:* total Q85.25 produce IVA Q9.13 y subtotal Q76.12.
- [x] **T07 (L) Autenticación JWT:** guest, qr, login, refresh, logout, me, claims `role` y `device`, throttle.
  *Aceptación:* pruebas de feature para cada ruta, incluido token expirado e inválido.
- [x] **T08 (L) Sesiones y escaneo:** `POST /sessions`, `GET /sessions/current`, `POST /scan`, `PATCH` y `DELETE` de ítems, `scan_events`, policies.
  *Aceptación:* escanear dos veces el mismo código da cantidad 2; código inválido da 422; código ajeno a la sesión da 403.
- [x] **T09 (M) Presupuesto y totales** en la respuesta de sesión (`level`, `used_percent`).
  *Aceptación:* con presupuesto Q100 y total Q85.25 el nivel es `warning` y el porcentaje 85.
- [x] **T10 (M) Ofertas:** `PromotionService`, `GET offers`, `POST offers/{id}/add`.
  *Aceptación:* las ofertas devueltas no incluyen productos que ya están en el carrito.
- [x] **T11 (L) Checkout y salida:** summary, checkout (CF o NIT), pago simulado, orden, código de salida, revisión aleatoria.
  *Aceptación:* una sesión pagada no admite cambios; el NIT inválido da 422.
- [x] **T12 (S) Documentación de la API** en `docs/api.md` (o colección HTTP para VS Code) con ejemplos reales.

**Definición de terminado del sprint:** `php artisan test` y `pint --test` en verde, flujo completo probado con la colección HTTP, `composer audit` sin críticos.

### Sprint 2: interfaz del quiosco (semanas 3 y 4)

Meta: recorrer el flujo completo con la interfaz y el panel de simulación.

- [x] **T13 (M) Base del frontend:** tokens, `TopBar`, `Button`, `Chip`, `Card`, cliente HTTP con interceptor de refresh, rutas.
  *Aceptación:* componentes visibles en una página `/dev/ui` (solo en modo demo).
- [ ] **T14 (M) Pantalla 1 (Inicio)** y autenticación como invitado y con QR de demostración.
  *Aceptación:* al elegir invitado se llega a `/cart` con una sesión activa.
- [ ] **T15 (L) Pantalla 2 (Carrito):** lista con `CartLine`, estados vacío y carga, cantidad y eliminar, total, anillo, franja del lector, resalte de "Recién escaneado".
  *Aceptación:* igual al diseño `screen2.png` con 4 productos y total Q70.25.
- [ ] **T16 (M) `useBarcodeScanner`** con pruebas de temporización y validación EAN.
  *Aceptación:* simulando teclas rápidas más Enter se agrega el producto; teclas lentas se ignoran.
- [ ] **T17 (M) Panel de simulación** completo (sección 8.4).
  *Aceptación:* "Escenario completo" deja 4 productos en la lista en menos de 8 segundos.
- [ ] **T18 (M) Presupuesto:** definir monto, modal de alerta al 80 % y 100 % (una vez por umbral).
  *Aceptación:* igual al diseño `screen3.png`.
- [ ] **T19 (M) Pantalla 4 (Ofertas)** y agregar desde la oferta.

**Definición de terminado:** recorrido inicio a ofertas funcionando con el panel de simulación; pruebas de componentes en verde; sin errores en la consola del navegador.

### Sprint 3: cierre, administración y demo (semanas 5 y 6)

- [ ] **T20 (L) Pantalla 5 (Resumen y pago)** con factura CF o NIT, métodos de pago y error de pago simulado.
- [ ] **T21 (M) Pantalla 6 (Salida)** con QR de salida y aviso de revisión.
- [ ] **T22 (L) Administración mínima:** login admin, CRUD de productos y ofertas, lista de compras y estadísticas básicas.
- [ ] **T23 (M) Prueba Playwright** del recorrido completo.
- [ ] **T24 (M) Pulido:** accesibilidad (foco visible, contraste, tamaños táctiles), modo quiosco (pantalla completa, sin selección de texto), inactividad, responsive 1024x768.
- [ ] **T25 (S) Guion de demostración** en `docs/demo.md`: pasos exactos, qué botones del panel pulsar, cómo reiniciar, plan B si falla la red.
- [ ] **T26 (S) Revisión final:** `composer audit`, `npm audit`, limpieza de `console.log`, `APP_DEBUG=false` en la configuración de demo, `README` actualizado.

**Definición de terminado del proyecto:** el recorrido completo se ejecuta tres veces seguidas sin errores, con el lector Bluetooth emparejado a la vista y el panel de simulación llevando el escaneo.

### 12.1 Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| El lector Bluetooth envía el código con prefijo o sufijo distinto | Configurar el lector en modo HID con terminador Enter; hacer configurable el sufijo en `useBarcodeScanner` |
| La tablet pierde conexión en la presentación | Ejecutar backend y frontend en la misma laptop y conectar la tablet por la red local, o mostrar la demo en la laptop con la tablet como soporte |
| El agente cambia el alcance sin avisar | Regla 6 de la sección 0 y revisión de cada commit |
| Se acaba el tiempo | Recortar en este orden: T22 (admin), T23 (Playwright), T19 (ofertas) |

---

## 13. Registro de decisiones (ADR resumido)

| Decisión | Opciones | Elegida y por qué | Costo y cuándo revisarla |
|---|---|---|---|
| Autenticación | Sanctum, Passport, JWT | **JWT** (requisito del equipo), paquete `php-open-source-saver/jwt-auth` mantenido | Más cuidado con invalidación y almacenamiento en el navegador. Revisar si hay clientes móviles nativos |
| Arquitectura de interfaz | Inertia + React, SPA separada | **SPA separada** con Vite: se puede mostrar en la tablet apuntando a la API y cada capa se prueba por separado | Dos proyectos que mantener y CORS. Revisar si el equipo prefiere un solo despliegue |
| Base de datos | MySQL, MariaDB, PostgreSQL | **MariaDB** (requisito) con driver `mariadb` | Sin tipos avanzados de PostgreSQL. No se necesitan en el alcance |
| Tiempo real | WebSockets, polling, invalidación | **Invalidación de caché** tras cada acción: un solo cliente por carrito | Si se agregan pantallas de personal que miren carritos en vivo, evaluar Reverb |
| Estado del carrito | Navegador, servidor | **Servidor**: sobrevive a recargas y es la única fuente de totales | Una petición por acción |
| Precios | Calcular en cliente, en servidor | **Servidor**, con precio congelado en el ítem | Ninguno relevante |
| Lector | API Web Bluetooth, modo HID | **Modo HID** (teclado): funciona en cualquier navegador y tablet | No hay estado de conexión real. Revisar si se usa un lector con SDK propio |
| Pagos y FEL | Integrar proveedor, simular | **Simular**. En un producto real se integraría un procesador de pagos y un certificador FEL autorizado por la SAT | Es lo primero a diseñar en una fase real |
| Imágenes de producto | Archivos, emojis | **Emojis** en la demo, columna `image_url` lista para fotos reales | Reemplazar por fotos antes de un piloto |
| Estilos del frontend | Tailwind v3, Tailwind v4 | **Tailwind v4** integrado con `@tailwindcss/vite` y tokens en `frontend/src/styles/tokens.css` | Revisar al introducir el sistema de componentes |
| Configuración local | Valores separados por capa | **Backend en `https://smartcart-api.test`, frontend en `http://localhost:5173` y CORS limitado a `FRONTEND_URL`** | Cambiar ambos orígenes juntos si se publica el frontend |
| Zona horaria | UTC, America/Guatemala | **America/Guatemala** para que la vigencia de ofertas use la hora local | Revisar si se agregan sucursales con distintas zonas |
| Pruebas PHP | PHPUnit 11, Pest 3, Pest 4 | **Pest 4.7.7 + Pest Laravel 4.1.0 + PHPUnit 12.5.33** por compatibilidad con Laravel 12 y PHP 8.4 | Revisar al actualizar Laravel o al resolver avisos de dependencias |
| TypeScript | TypeScript 7, TypeScript 5 | **TypeScript 5.9.3** porque `typescript-eslint` aún no soporta TypeScript 7 | Subir cuando ESLint/TypeScript ESLint publique soporte estable |
| Esquema T04 | Migración única, migraciones separadas | **11 tablas propias en migraciones ordenadas por dependencias; tablas framework conservadas** | Revisar índices y restricciones al agregar reglas de negocio |
| Seeders T05 | Datos manuales, factories, `updateOrCreate` | **Seeder idempotente con catálogo demo fijo, `CART-07` y contraseña admin desde `SEED_ADMIN_PASSWORD`** | Revisar al agregar productos, ofertas o datos de otras sucursales |
| Cálculo T06 | `float`, BCMath, centavos enteros | **Centavos enteros y redondeo half up para evitar errores de precisión monetaria** | Revisar si se requieren monedas o tasas con más de dos decimales |
| Autenticación T07 | Sanctum, Passport, JWT | **JWT con `php-open-source-saver/jwt-auth` v2.10.0, guard `api`, blacklist activa y claims de rol/dispositivo** | Revisar rotación de secreto y almacenamiento de tokens si cambia el despliegue |
| Carrito T08 | Bloqueo de ítem, bloqueo de sesión, sin transacción | **Cada escaneo bloquea la sesión con `lockForUpdate`; el precio queda congelado al agregar** | Revisar si el volumen requiere colas o partición de eventos |
| Checkout T11 | Fallo simulado configurable, pago real | **Checkout atómico; `simulate_failure` y `force_check` solo funcionan con `DEMO_MODE=true`; NIT validado con módulo 11** | Integrar proveedor de pagos y FEL si deja de ser una demo |
| Frontend T13 | Cliente HTTP propio, estado global, librería de datos | **TanStack Query 5.107.1, Zustand 5.1.0, React Router 7.18.5 y lucide-react 1.70.0; token en `sessionStorage` con un refresh compartido** | Integrar autenticación y datos reales en las pantallas T14-T15 |

**Qué revisar si el sistema crece:** múltiples sucursales y carritos (tabla de tiendas), sincronización de catálogo con el supermercado, colas para facturación, observabilidad (logs estructurados y métricas), almacenamiento de imágenes, modo sin conexión con cola local de escaneos.

---

## 14. Primer mensaje sugerido para el agente

Pega esto en Codex o Claude Code para empezar:

> Lee `AGENTS.md` completo. Resume en 8 líneas cómo vas a trabajar y confirma el stack. Después propón el plan detallado de la tarea **T01** (archivos que crearás y comandos que ejecutarás) y espera mi aprobación antes de ejecutar nada.

Para las siguientes tareas:

> Continúa con la tarea **T0X** de `AGENTS.md`. Muéstrame el plan breve, espera mi aprobación, impleméntala con pruebas, ejecuta los comandos de calidad, dame los pasos para probarla a mano y haz el commit.

---

## 15. Glosario

- **EAN-13:** código de barras de 13 dígitos. El último es verificador. El prefijo 740 corresponde a Guatemala.
- **HID:** perfil de teclado. El lector "escribe" el código y envía Enter.
- **FEL:** Factura Electrónica en Línea de la SAT. Aquí solo se simula.
- **NIT / CF:** Número de Identificación Tributaria / Consumidor Final.
- **Modo quiosco:** la tablet muestra solo la aplicación en pantalla completa.
