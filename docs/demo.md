# Guion de demostración de SmartCart

Este guion está pensado para una presentación con el frontend en `http://localhost:5173` y el backend de Herd en `https://smartcart-api.test`. Los textos de los botones se verificaron contra la interfaz actual.

## Lista previa de 2 minutos

- [ ] Conectar la computadora a la corriente y comprobar que el lector Bluetooth aparece físicamente instalado.
- [ ] Encender MariaDB y comprobar que existe la base `smartcart`.
- [ ] Abrir Herd y confirmar que `https://smartcart-api.test/up` responde `200`.
- [ ] En `frontend/`, ejecutar `npm run dev` y abrir `http://localhost:5173`.
- [ ] Confirmar que `VITE_DEMO_MODE=true` y que aparece el botón “Abrir panel de simulación” en `/cart`.
- [ ] Tener a mano la contraseña definida localmente para el administrador; nunca se escribe en este documento.
- [ ] Hacer una compra de prueba como invitado, abrir el panel y confirmar que aparece “Leche entera 1 litro”. Reiniciar la demo antes de presentar.

Si la presentación usa Chrome en modo quiosco:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk http://localhost:5173
```

## Recorrido de 5 minutos

### Inicio — 0:00 a 0:30

| Qué hacer                                   | Qué decir                                                           | Qué debe verse                                          |
| ------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Abrir `/` y pulsar “Comprar como invitado”. | “SmartCart identifica el carrito y permite iniciar sin una cuenta.” | “¡Bienvenido a SmartCart!” y `/cart` con carrito vacío. |

### Escaneo — 0:30 a 1:30

| Qué hacer                                                        | Qué decir                                                                      | Qué debe verse                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Pulsar “Abrir panel de simulación” y luego “Escenario completo”. | “El panel simula el lector Bluetooth y usa el mismo flujo que el lector real.” | El panel se cierra y la lista crece con leche, pan, gaseosa y huevos; el contador muestra 4 productos. |
| Señalar la franja del lector.                                    | “Cada escaneo actualiza el carrito desde el servidor.”                         | La línea más reciente se marca “Recién escaneado”.                                                     |

### Ofertas — 1:30 a 2:00

| Qué hacer                                 | Qué decir                                                      | Qué debe verse                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Pulsar “Ver ofertas” y volver al carrito. | “Las ofertas vienen del servidor y desaparecen al agregarlas.” | Hasta 3 ofertas activas; ahorro y tachado solo cuando aplica; la promoción de jugo muestra “2x1”. |

### Presupuesto — 2:00 a 2:45

| Qué hacer                                                                          | Qué decir                                                           | Qué debe verse                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Abrir el panel, pulsar “Definir presupuesto Q100” y agregar un producto adicional. | “El anillo usa los totales del servidor y avisa al llegar al 80 %.” | Alerta “Alerta de presupuesto” con porcentaje y valores del servidor. |
| Agregar otro producto hasta superar 100 %.                                         | “Superar el presupuesto no bloquea la compra.”                      | Alerta roja “Superaste tu presupuesto” con el monto excedido.         |

### Pago y salida — 2:45 a 4:30

| Qué hacer                                                     | Qué decir                                                                    | Qué debe verse                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| Pulsar “Ir a pagar”, dejar “CF” y pulsar “Pagar con tarjeta”. | “El resumen y el IVA se recalculan en el servidor; usamos Consumidor Final.” | `/checkout` y luego `/exit` con código de salida.         |
| Mostrar el QR y “Nueva compra”.                               | “El QR codifica únicamente el código de salida.”                             | “Código QR de salida” y aviso de revisión si corresponde. |

### Cierre — 4:30 a 5:00

| Qué hacer              | Qué decir                                                            | Qué debe verse                   |
| ---------------------- | -------------------------------------------------------------------- | -------------------------------- |
| Pulsar “Nueva compra”. | “El reinicio limpia carrito, presupuesto, factura y orden anterior.” | `/` lista para una compra nueva. |

## Recorrido de 10 minutos

Usa el recorrido de 5 minutos y añade:

1. Con Q100, ejecuta “Escenario completo” y agrega productos hasta cruzar 80 %. Pausa para explicar la alerta; agrega otro producto para cruzar 100 % y muestra que “Ir a pagar” continúa habilitado.
2. Pulsa “Nueva compra”, inicia otra compra y agrega un producto. En checkout cambia a NIT, escribe un NIT válido local de prueba y paga. Explica que CF no solicita NIT.
3. Activa “Forzar fallo de pago”, pulsa “Pagar con tarjeta” y muestra el error bajo la sección de pago. Desactiva la bandera y reintenta; el carrito permanece intacto.
4. Activa “Forzar revisión”, paga y muestra el aviso destacado, el QR y el regreso automático cancelable.
5. Abre `/admin`, inicia sesión con `admin@smartcart.test` y la contraseña definida localmente. Muestra Resumen, Productos, Promociones y Compras, incluyendo “Más vendidos”, búsqueda, estados y detalle.

## Catálogo y promociones

|   # | EAN-13          | Producto                      | Precio |
| --: | --------------- | ----------------------------- | -----: |
|   1 | `7401000000015` | Leche entera 1 litro          | Q11.75 |
|   2 | `7401000000022` | Queso fresco 400 g            | Q28.00 |
|   3 | `7401000000039` | Mantequilla 250 g             | Q15.50 |
|   4 | `7401000000046` | Pan de caja                   | Q18.50 |
|   5 | `7401000000053` | Tortillas de maíz 1 libra     |  Q6.00 |
|   6 | `7401000000060` | Gaseosa 2 litros              | Q14.00 |
|   7 | `7401000000077` | Jugo de naranja 1 litro       | Q15.00 |
|   8 | `7401000000084` | Agua pura 600 ml              |  Q5.00 |
|   9 | `7401000000091` | Café molido 400 g             | Q38.00 |
|  10 | `7401000000107` | Huevos docena                 | Q26.00 |
|  11 | `7401000000114` | Frijol negro volteado en lata | Q15.00 |
|  12 | `7401000000121` | Arroz 2 libras                | Q14.50 |
|  13 | `7401000000138` | Azúcar 2 libras               | Q12.00 |
|  14 | `7401000000145` | Aceite vegetal 1 litro        | Q29.00 |
|  15 | `7401000000152` | Espagueti 400 g               |  Q8.50 |
|  16 | `7401000000169` | Cereal de avena 500 g         | Q20.00 |
|  17 | `7401000000176` | Galletas de soda              |  Q9.00 |
|  18 | `7401000000183` | Papel higiénico 4 rollos      | Q22.00 |
|  19 | `7401000000190` | Detergente en polvo 1 kg      | Q25.00 |
|  20 | `7401000000206` | Champú 400 ml                 | Q34.00 |

Promociones iniciales:

- Cereal de avena (`7401000000169`): Q16.00, antes Q20.00.
- Mantequilla (`7401000000039`): Q13.50, antes Q15.50.
- Jugo de naranja (`7401000000077`): Q15.00, etiqueta “2x1 en la segunda unidad” informativa.

## Plan B

- **Lector Bluetooth:** usa `Ctrl+Shift+D` o “Abrir panel de simulación” y pulsa los productos. “Prueba sin lector” significa este panel y no requiere hardware.
- **Herd apagado:** pulsa “Reintentar”. Si no vuelve, continúa con capturas o la colección HTTP preparada; no inventes datos en el navegador.
- **MariaDB caída:** corrige el servicio y reinicia backend/frontend. No ejecutes migraciones destructivas durante la presentación.
- **Pérdida de red:** no repitas pagos; espera la conexión y reintenta solo la acción indicada por el mensaje.
- **Navegador cerrado:** abre de nuevo `http://localhost:5173`. El token vive en `sessionStorage`, así que inicia una compra nueva como invitado.

## Reinicio seguro de la demo

El reinicio completo borra la base configurada en `backend/.env`, incluidos productos y promociones creados manualmente, y vuelve a cargar el catálogo inicial. Requiere escribir exactamente `REINICIAR DEMO`.

Desde PowerShell:

```powershell
cd C:\Users\josej\Downloads\SmartCart\backend
.\scripts\reset-demo.ps1
```

El script se niega a continuar si `DB_DATABASE` es `smartcart_test`; está diseñado únicamente para la base de demo. Revisa la advertencia antes de confirmar.
