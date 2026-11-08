# API de SmartCart

Referencia para el frontend de SmartCart. La API devuelve JSON y todos los
mensajes de error están en español.

## Conexión

```text
Base URL: https://smartcart-api.test/api/v1
Content-Type: application/json
Authorization: Bearer <access_token>
```

Los ejemplos ejecutables están en [auth.http](./api/auth.http) y
[sessions.http](./api/sessions.http). En VS Code, reemplaza las variables
`<...>` por valores locales. Nunca guardes tokens ni contraseñas en el
repositorio.

## Tipos TypeScript

Estos tipos son deliberadamente independientes de una librería HTTP y se
pueden copiar a `frontend/src/api/types.ts` en T13.

```ts
export type UserRole = 'customer' | 'guest' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string | null;
  role: UserRole;
  qr_code?: string | null;
  nit?: string | null;
}

export interface Item {
  id: number;
  product: {
    name: string;
    category: string;
    emoji: string;
  };
  quantity: number;
  unit_price: string;
  line_total: string;
  promo_applied: boolean;
  is_new: boolean;
}

export interface Budget {
  amount: string | null;
  used_percent: number;
  remaining: string | null;
  level: 'none' | 'ok' | 'warning' | 'exceeded';
}

export interface SessionTotals {
  items_count: number;
  subtotal: string;
  vat: string;
  total: string;
}

export interface Session {
  id: number;
  status: 'active' | 'checkout' | 'paid' | 'cancelled';
  items: Item[];
  totals: SessionTotals;
  budget: Budget;
}

export interface Offer {
  id: number;
  name: string;
  emoji: string;
  category: string;
  original_price: string;
  promo_price: string;
  saving: string;
  label: string;
}

export interface Order {
  id: number;
  shopping_session_id: number;
  invoice_type: 'CF' | 'NIT';
  nit: string | null;
  subtotal: string;
  vat: string;
  total: string;
  payment_method: 'card' | 'fast_checkout';
  status: 'paid' | 'pending_cashier' | 'failed';
  requires_check: boolean;
  exit_code: string;
  items?: Array<{
    product_id: number;
    name_snapshot: string;
    unit_price: string;
    quantity: number;
    line_total: string;
  }>;
  payment?: {
    method: 'card' | 'fast_checkout';
    status: 'approved' | 'pending' | 'failed';
    simulated: boolean;
    reference: string | null;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
```

Los importes son cadenas con dos decimales para evitar errores de precisión.
`is_new` solo es `true` para la línea tocada por el último escaneo.

## Autenticación

### Invitado

```http
POST /auth/guest
Content-Type: application/json

{"device_code":"CART-07"}
```

Respuesta `200` (el valor de `access_token` se omite aquí):

```json
{
  "access_token": "<redactado>",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 42,
    "name": "Invitado",
    "email": null,
    "role": "guest",
    "qr_code": null,
    "nit": null
  }
}
```

El token identifica el dispositivo y se envía como `Authorization: Bearer ...`
en las rutas protegidas. `POST /auth/qr` usa `qr_code` y `device_code`; el QR
de demostración es `SC-DEMO-0001`. `POST /auth/login` recibe `email` y
`password`; la contraseña se toma de `SEED_ADMIN_PASSWORD` local.

`POST /auth/refresh` devuelve otro objeto de token. `POST /auth/logout`
invalida el token actual y cualquier uso posterior de ese token responde `401`.
`GET /auth/me` responde `{ "user": User }`.

## Sesiones y carrito

Todas estas rutas requieren Bearer.

### Crear o recuperar la sesión

```http
POST /sessions

{}
```

También acepta `{ "budget": "100.00" }`. La respuesta es `Session` con
estado `active`. El presupuesto puede definirse o quitarse con:

```http
PUT /sessions/current/budget

{"budget":"100.00"}
```

Para quitarlo: `{ "budget": null }`. `GET /sessions/current` devuelve la
sesión activa completa.

### Escanear

```http
POST /sessions/current/scan

{"barcode":"7401000000015","source":"simulation"}
```

`source` solo puede ser `reader` o `simulation`. La respuesta tiene:

```json
{
  "session": { "id": 12, "status": "active", "items": [], "totals": {}, "budget": {} },
  "scan": { "result": "added", "message": "Producto agregado al carrito." }
}
```

Repetir el código incrementa la misma línea. La cantidad máxima es 99.
También existen `PATCH /sessions/current/items/{item}` con
`{ "quantity": 3 }` y `DELETE /sessions/current/items/{item}`.

`GET /sessions/current/summary` devuelve `{ "items": Item[], "totals": SessionTotals }`.

## Ofertas

`GET /sessions/current/offers` devuelve `{ "offers": Offer[] }`, hasta tres
promociones activas, priorizando categorías presentes en el carrito.
`POST /sessions/current/offers/{promotion}/add` agrega la oferta y congela su
precio promocional. Una oferta no puede agregarse si su producto ya está en
el carrito.

## Checkout y salida

El checkout recalcula los importes desde `cart_items`; nunca usa totales del
cliente.

```http
POST /sessions/current/checkout

{"invoice_type":"CF","payment_method":"card"}
```

Para NIT, `invoice_type` debe ser `NIT` y `nit` es obligatorio. El NIT se
envía como texto y acepta guion y espacios opcionales: `123456-0` y `1234560`
son equivalentes. El backend normaliza ambos antes de validar. `CF` también
se acepta en minúsculas, pero la orden queda normalizada como `CF`.

El algoritmo de la demo toma el último dígito como verificador, multiplica la
base por pesos descendentes desde `n+1` hasta `2`, calcula `11 - (suma % 11)`
y convierte 11 en 0. Por eso `123456-0` es válido y `123456-9` no lo es.

El método `fast_checkout` crea una orden `pending_cashier`. Una orden pagada
queda asociada a una sola sesión; un segundo checkout se rechaza.

Si `DEMO_MODE=true`, el body puede incluir:

```json
{
  "invoice_type": "CF",
  "payment_method": "card",
  "simulate_failure": true,
  "force_check": true
}
```

`simulate_failure` solo simula el rechazo de tarjeta y deja la sesión activa.
`force_check` fuerza `requires_check=true`. Ambos campos se respetan
únicamente con `DEMO_MODE=true`; fuera de ese modo no alteran el flujo de pago.

El panel de simulación del frontend guarda `force_check` y `simulate_failure`
como banderas de la interfaz. T20 las enviará en el body de checkout con esos
mismos nombres; no crean endpoints ni modifican el esquema. Reiniciar la demo
usa el `POST /sessions` existente para cancelar la sesión activa del dispositivo,
limpia ambas banderas y vuelve al inicio.

`GET /orders/{order}/exit` devuelve:

```json
{"exit_code":"SC0725","requires_check":false}
```

Solo el dueño de la orden puede consultar este recurso.

## Flujo completo guest → salida

1. `POST /auth/guest` con `{ "device_code": "CART-07" }` y guarda el token
   solo en memoria de la sesión del navegador.
2. `POST /sessions` con `{ "budget": "100.00" }`.
3. `POST /sessions/current/scan` con el EAN `7401000000015` y
   `source: "simulation"`.
4. `GET /sessions/current` o `/summary` para mostrar totales.
5. `POST /sessions/current/checkout` con `CF` y `card`; guarda el `order.id`.
6. `GET /orders/{order.id}/exit` y muestra `exit_code` y `requires_check`.

Para ejecutar el recorrido en VS Code usa en orden los ejemplos de
[auth.http](./api/auth.http) y [sessions.http](./api/sessions.http), copiando
el token y el id de orden únicamente en los placeholders locales.

## Errores para el frontend

La forma base es siempre `{ message, errors }`. `errors` contiene arreglos por
campo cuando el error es de validación; puede omitirse en errores de negocio.

| HTTP | Caso | Respuesta de ejemplo |
|---:|---|---|
| 401 | Token ausente, inválido o vencido | `{ "message": "Token no válido o ausente.", "errors": {} }` |
| 403 | Sesión u orden ajena | `{ "message": "No tienes permiso para consultar esta orden.", "errors": {} }` |
| 404 | Producto inexistente o inactivo | `{ "message": "Este producto no está en el catálogo", "errors": {} }` |
| 422 | Código mal formado | `{ "message": "Los datos proporcionados no son válidos.", "errors": { "barcode": ["El código de barras no es un EAN-13 válido."] } }` |
| 422 | Límite de 99 unidades | `{ "message": "La cantidad máxima por línea es 99 unidades.", "errors": { "quantity": ["La cantidad máxima por línea es 99 unidades."] } }` |
| 422 | Carrito vacío | `{ "message": "No puedes pagar un carrito vacío.", "errors": {} }` |
| 422 | Pago duplicado | `{ "message": "Esta sesión ya tiene un pago registrado.", "errors": {} }` |
| 422 | NIT inválido | `{ "message": "El NIT no es válido.", "errors": { "nit": ["El NIT no es válido."] } }` |
| 422 | Tarjeta simulada rechazada | `{ "message": "El pago con tarjeta fue rechazado en la simulación.", "errors": {} }` |
| 429 | Más de 5 intentos de login en un minuto | `{ "message": "Demasiados intentos; intenta de nuevo más tarde.", "errors": {} }` |

Otros mensajes útiles son `No tienes una sesión de compra activa.` (404),
`Este producto ya está en tu carrito.` (422) y
`El presupuesto debe ser mayor que Q0.00.` (422).

## Convenciones

- IVA incluido: `vat = total * 12 / 112`, redondeado half up a centavos.
- El servidor es la fuente de verdad para precios, totales, presupuesto y
  autorización.
- Las sesiones pagadas no admiten cambios; superar el presupuesto solo cambia
  `budget.level` a `exceeded` y no bloquea escaneo ni pago.
