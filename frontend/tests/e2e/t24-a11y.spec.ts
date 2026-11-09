import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from 'playwright/test'

async function startGuest(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Comprar como invitado/i }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

async function scan(page: Page) {
  await page.getByRole('button', { name: /Abrir panel de simulaci/i }).click()
  await page.getByRole('button', { name: /Leche entera 1 litro/i }).click()
  await page.getByRole('button', { name: /Cerrar panel de simulaci/i }).click()
  await expect(
    page.getByText('Leche entera 1 litro', { exact: true }),
  ).toBeVisible()
}

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  )
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
}

test('inicio no tiene violaciones graves', async ({ page }) => {
  await page.goto('/')
  await expectNoSeriousViolations(page)
})

test('carrito no tiene violaciones graves', async ({ page }) => {
  await startGuest(page)
  await expectNoSeriousViolations(page)
})

test('ofertas no tiene violaciones graves', async ({ page }) => {
  await startGuest(page)
  await page.getByRole('button', { name: /Ver ofertas/i }).click()
  await expect(page).toHaveURL(/\/offers$/)
  await expectNoSeriousViolations(page)
})

test('checkout no tiene violaciones graves', async ({ page }) => {
  await startGuest(page)
  await scan(page)
  await page.getByRole('button', { name: /Ir a pagar/i }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expectNoSeriousViolations(page)
})

test('salida no tiene violaciones graves', async ({ page }) => {
  await startGuest(page)
  await scan(page)
  await page.getByRole('button', { name: /Ir a pagar/i }).click()
  await page.getByRole('button', { name: /Pagar con tarjeta/i }).click()
  await expect(page).toHaveURL(/\/exit$/)
  await expectNoSeriousViolations(page)
})
