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
- `docs/`: diseño y documentación del producto.
