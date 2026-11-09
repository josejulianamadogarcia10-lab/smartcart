import { test, expect } from 'playwright/test'
import fs from 'node:fs'

function adminPassword(): string {
  const env = fs.readFileSync('../backend/.env', 'utf8')
  return env.match(/^SEED_ADMIN_PASSWORD=(.*)$/m)?.[1]?.trim() ?? ''
}

test('el modal de producto permite escribir en Nombre', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel('Correo').fill('admin@smartcart.test')
  await page.getByLabel('Contraseña').fill(adminPassword())
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('Panel de administración')).toBeVisible()
  await page.getByRole('button', { name: 'Productos' }).click()
  await page.getByRole('button', { name: 'Nuevo producto' }).click()
  const name = page.getByLabel('Nombre')
  await expect(name).toBeVisible()
  await name.fill('Producto de prueba')
  await expect(name).toHaveValue('Producto de prueba')
})
