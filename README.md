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

No guardes esos valores en archivos versionados. Cada prueba crea su propio invitado y sesión; el backend E2E usa `DEMO_MODE=true` y el frontend `VITE_DEMO_MODE=true`.
- `docs/`: diseño y documentación del producto.
