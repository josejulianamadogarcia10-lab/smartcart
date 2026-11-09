# SmartCart

Carrito de compras inteligente para la demo universitaria de Administración de Empresas, UVG Campus Sur.

## T01: esqueleto local

### Backend

```powershell
cd backend
& 'C:\Users\josej\.config\herd\bin\herd.bat' link smartcart-api
& 'C:\Users\josej\.config\herd\bin\herd.bat' secure
```

Laravel incluye el endpoint de salud en `https://smartcart-api.test/up`.

### Frontend

```powershell
cd frontend
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

La SPA queda disponible en `http://localhost:5173`.

Para una demo local, define explícitamente `DEMO_MODE=true` en el `.env` de
`backend/` y `VITE_DEMO_MODE=true` en el `.env` de `frontend/`. Los ejemplos
versionados dejan ambos valores en `false` por seguridad. El backend acepta
únicamente el origen indicado por `FRONTEND_URL` (por defecto,
`http://localhost:5173`); no uses comodines en CORS.

## Estructura

- `backend/`: API Laravel 12.
- `frontend/`: SPA React 19 + TypeScript + Vite + Tailwind CSS v4.

## T23: prueba E2E aislada

La suite levanta Laravel en `http://127.0.0.1:8001` y Vite en
`http://127.0.0.1:5180`. Verifica que la base sea exactamente `smartcart_test`
antes de preparar datos; si no existe o fallan las credenciales, aborta sin
tocarla. Reportes, capturas y trazas quedan en `frontend/e2e-artifacts/`,
ignorado por Git.

En PowerShell define las variables solo en la sesión actual y ejecuta un único comando:

```powershell
$env:E2E_ADMIN_PASSWORD = '<contraseña del admin E2E>'
$env:E2E_DB_DATABASE = 'smartcart_test'
$env:E2E_DB_HOST = '127.0.0.1'
$env:E2E_DB_PORT = '3306'
$env:E2E_DB_USERNAME = '<usuario de smartcart_test>'
$env:E2E_DB_PASSWORD = '<contraseña de smartcart_test>'
$env:E2E_JWT_SECRET = '<secreto JWT exclusivo para E2E>'
$env:E2E_PHP = 'C:\Users\josej\.config\herd\bin\php.bat'
cd frontend
npm run test:e2e
```

La suite usa `@axe-core/playwright` **4.10.2**, fijado por compatibilidad con
Node 20. No se ejecuta como parte de la calidad local de T26; el comando anterior
queda listo para ejecutarlo después de definir todas las variables E2E.

## Auditoría de dependencias y secretos

`composer audit` no reporta avisos. `npm audit` reporta 10 vulnerabilidades
moderadas, todas en `devDependencies` y ninguna alta o crítica. Las correcciones
automáticas disponibles requieren saltos de versión mayor de ESLint y
TypeScript ESLint, por lo que no se aplican en esta revisión.

Los archivos `.env` y `.env.e2e` están ignorados por Git; los archivos de ejemplo
no contienen valores reales. Antes de la presentación final puedes regenerar las
claves locales con:

```powershell
cd backend
php artisan key:generate
php artisan jwt:secret
```

Estas acciones invalidan las sesiones y tokens activos. No las ejecutes durante
la demo ni se incluyen en el arranque automático.

No guardes esos valores en archivos versionados. Cada prueba crea su propio invitado y sesión; el backend E2E usa `DEMO_MODE=true` y el frontend `VITE_DEMO_MODE=true`.
- `docs/`: diseño y documentación del producto.
## T24: modo quiosco y accesibilidad

En el cliente, el botón de pantalla completa requiere un gesto del usuario. También se puede iniciar Chrome en modo quiosco con:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk http://localhost:5173
```

La pantalla `/cart` avisa después de 3 minutos sin actividad. Si el carrito está vacío, vuelve al inicio a los 5 minutos; con productos nunca expulsa al cliente. Un toque, tecla o escaneo reinicia el contador. Los tiempos se configuran en `frontend/src/config/kiosk.ts`.

La auditoría de accesibilidad y las pruebas E2E aisladas se ejecutan con:

```powershell
cd frontend
$env:E2E_ADMIN_PASSWORD = "<contraseña local>"
$env:E2E_DB_DATABASE = "smartcart_test"
npm run test:e2e
```
