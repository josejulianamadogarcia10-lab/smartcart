import { expect, test, type Page } from 'playwright/test'

const adminPassword = process.env.E2E_ADMIN_PASSWORD
if (!adminPassword) {
  throw new Error(
    'E2E abortado: define E2E_ADMIN_PASSWORD antes de ejecutar Playwright.',
  )
}

const product = 'Leche entera 1 litro'

async function startGuest(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Comprar como invitado/i }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

async function openPanel(page: Page) {
  await page.getByRole('button', { name: /Abrir panel de simulaci/i }).click()
}

async function scanProduct(page: Page, name = product) {
  await openPanel(page)
  await page.getByRole('button', { name: new RegExp(name, 'i') }).click()
  await page.getByRole('button', { name: /Cerrar panel de simulaci/i }).click()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

async function checkout(page: Page) {
  await page.getByRole('button', { name: /Ir a pagar/i }).click()
  await expect(page).toHaveURL(/\/checkout$/)
}

test('compra feliz como invitado, presupuesto, ofertas, CF y QR de salida', async ({
  page,
}) => {
  await startGuest(page)
  await openPanel(page)
  await page.getByRole('button', { name: /Definir presupuesto Q100/i }).click()
  await page.getByRole('button', { name: /Escenario completo/i }).click()
  await expect(page.getByText(/productos?/i).first()).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: /Ver ofertas/i }).click()
  await expect(page).toHaveURL(/\/offers$/)
  await expect(page.getByText(/Ofertas/i).first()).toBeVisible()
  await page.getByRole('button', { name: /Volver al carrito/i }).click()
  await checkout(page)
  await page.getByRole('button', { name: /Pagar con tarjeta/i }).click()
  await expect(page).toHaveURL(/\/exit$/)
  await expect(page.getByLabel(/C.digo QR de salida/i)).toBeVisible()
  await page.getByRole('button', { name: /Cancelar regreso/i }).click()
})

test('fallo simulado conserva el carrito y permite reintentar', async ({
  page,
}) => {
  await startGuest(page)
  await scanProduct(page)
  await openPanel(page)
  await page.getByRole('checkbox', { name: /Forzar fallo de pago/i }).check()
  await page.getByRole('button', { name: /Cerrar panel de simulaci/i }).click()
  await checkout(page)
  await page.getByRole('button', { name: /Pagar con tarjeta/i }).click()
  await expect(page.getByRole('alert')).toContainText(/pago|procesar/i)
  await page.getByRole('button', { name: /Volver al carrito/i }).click()
  await checkout(page)
  await page.getByRole('button', { name: /Pagar con tarjeta/i }).click()
  await expect(page).toHaveURL(/\/exit$/)
})

test('forzar revisión la muestra en salida', async ({ page }) => {
  await startGuest(page)
  await scanProduct(page)
  await openPanel(page)
  await page.getByRole('checkbox', { name: /Forzar revisi/i }).check()
  await page.getByRole('button', { name: /Cerrar panel de simulaci/i }).click()
  await checkout(page)
  await page.getByRole('button', { name: /Pagar con tarjeta/i }).click()
  await expect(page).toHaveURL(/\/exit$/)
  await expect(page.getByText(/revisi/i)).toBeVisible()
  await page.getByRole('button', { name: /Cancelar regreso/i }).click()
})

test('NIT inválido muestra el error bajo el campo', async ({ page }) => {
  await startGuest(page)
  await scanProduct(page)
  await checkout(page)
  await page.getByRole('button', { name: /Cambiar NIT/i }).click()
  await page.getByLabel('NIT').fill('123456-9')
  await page.getByRole('button', { name: /Pagar con tarjeta/i }).click()
  await expect(page.locator('#nit-error')).toBeVisible()
  await expect(page.locator('#nit-error')).toContainText(/NIT|inválido|dígito/i)
})

test('cliente no puede entrar al admin y la API responde 403', async ({
  page,
}) => {
  await startGuest(page)
  const result = await page.evaluate(async () => {
    const token = sessionStorage.getItem('smartcart.access_token')
    const response = await fetch(
      'http://127.0.0.1:8001/api/v1/admin/products',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    return { status: response.status }
  })
  expect(result.status).toBe(403)
  await page.goto('/admin')
  await expect(page.getByText(/Acceso exclusivo/i)).toBeVisible()
})

test('admin inicia sesión y puede ver el panel', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel('Correo').fill('admin@smartcart.test')
  await page.getByLabel(/Contrase/i).fill(adminPassword)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText(/Panel de administraci/i)).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Productos', exact: true }),
  ).toBeVisible()
})

test('el regreso automático de salida usa el reloj de Playwright', async ({
  page,
}) => {
  await startGuest(page)
  await scanProduct(page)
  await page.clock.install()
  await checkout(page)
  await page.getByRole('button', { name: /Pagar con tarjeta/i }).click()
  await expect(page).toHaveURL(/\/exit$/)
  await expect(
    page.getByText(/Volviendo al inicio en (?:59|60) s/i),
  ).toBeVisible()
  for (let second = 0; second < 65; second += 1) {
    await page.clock.runFor(1_000)
  }
  await expect(page).toHaveURL(/\/$/)
})
