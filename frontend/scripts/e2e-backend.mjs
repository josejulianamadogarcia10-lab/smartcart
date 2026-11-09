/* global process, console */
import { spawn } from 'node:child_process'

const required = [
  'E2E_ADMIN_PASSWORD',
  'E2E_DB_DATABASE',
  'E2E_DB_HOST',
  'E2E_DB_PORT',
  'E2E_DB_USERNAME',
  'E2E_DB_PASSWORD',
  'E2E_JWT_SECRET',
]

for (const name of required) {
  if (!process.env[name]) {
    console.error(`E2E abortado: define ${name} como variable de entorno.`)
    process.exit(1)
  }
}

if (process.env.E2E_DB_DATABASE !== 'smartcart_test') {
  console.error(
    'E2E abortado: E2E_DB_DATABASE debe ser exactamente smartcart_test.',
  )
  process.exit(1)
}

const php = process.env.E2E_PHP ?? 'php'
const backendEnv = {
  ...process.env,
  APP_ENV: 'testing',
  APP_DEBUG: 'true',
  APP_URL: 'http://127.0.0.1:8001',
  FRONTEND_URL: 'http://127.0.0.1:5180',
  DB_CONNECTION: 'mariadb',
  DB_HOST: process.env.E2E_DB_HOST,
  DB_PORT: process.env.E2E_DB_PORT,
  DB_DATABASE: 'smartcart_test',
  DB_USERNAME: process.env.E2E_DB_USERNAME,
  DB_PASSWORD: process.env.E2E_DB_PASSWORD,
  JWT_SECRET: process.env.E2E_JWT_SECRET,
  DEMO_MODE: 'true',
  DEMO_FAIL_NEXT_PAYMENT: 'false',
  EXIT_CHECK_PROBABILITY: '0',
  E2E_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD,
}

const runPhp = (args) =>
  new Promise((resolve, reject) => {
    if (backendEnv.DB_DATABASE !== 'smartcart_test') {
      reject(
        new Error(
          'Protección E2E: se rechazó un comando fuera de smartcart_test.',
        ),
      )
      return
    }
    const child = spawn(php, args, {
      cwd: '../backend',
      env: backendEnv,
      shell: true,
    })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk
    })
    child.stderr.on('data', (chunk) => {
      output += chunk
    })
    child.on('close', (code) =>
      code === 0 ? resolve(output) : reject(new Error(output)),
    )
  })

try {
  await runPhp(['artisan', 'migrate:status'])
} catch (error) {
  console.error(
    'E2E abortado: no se pudo conectar a smartcart_test. Verifica que la base exista y que E2E_DB_* sea correcto.',
  )
  console.error(error.message)
  process.exit(1)
}

try {
  await runPhp(['artisan', 'migrate:fresh', '--seed'])
} catch (error) {
  console.error(
    'E2E abortado: no se pudo preparar smartcart_test con migrate:fresh --seed.',
  )
  console.error(error.message)
  process.exit(1)
}

const server = spawn(
  php,
  ['-S', '127.0.0.1:8001', '-t', 'public', 'public/index.php'],
  {
    cwd: '../backend',
    env: backendEnv,
    shell: true,
    stdio: 'inherit',
  },
)

const stop = () => {
  if (!server.killed) server.kill()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
process.on('exit', stop)
await new Promise((resolve) => server.on('close', resolve))
