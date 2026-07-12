#!/usr/bin/env node
// Smoke tests mínimos (deployment-spec.md §7), executados dentro de um
// container conectado à rede do Docker Compose. Não depende de dados do
// seed: cria e usa sua própria organização descartável a cada execução.
// Uso: docker compose run --rm smoke-test

const API_URL = process.env.API_URL ?? 'http://api:3000'
const WEB_URL = process.env.WEB_URL ?? 'http://web:5173'

let failures = 0

function check(name, ok, detail = '') {
  if (ok) {
    console.log(`OK   ${name}`)
  } else {
    failures += 1
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function main() {
  // 1. Health check da API
  const healthRes = await fetch(`${API_URL}/api/v1/health`)
  const health = await healthRes.json().catch(() => null)
  check(
    'health check da API',
    healthRes.status === 200 &&
      health?.status === 'ok' &&
      health?.services?.database === 'ok' &&
      health?.services?.redis === 'ok',
    JSON.stringify(health),
  )

  // 2. Frontend carrega
  const webRes = await fetch(WEB_URL)
  check('frontend carrega', webRes.status === 200, `status ${webRes.status}`)

  // 3. Login funciona (via registro de organização descartável — não depende do seed)
  const runId = Date.now()
  const email = `smoke-${runId}@example.com`
  const password = 'smoke-test-password-123'

  const registerRes = await fetch(`${API_URL}/api/v1/auth/register-organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationName: `Smoke Test ${runId}`,
      ownerName: 'Smoke Test',
      ownerEmail: email,
      password,
    }),
  })
  const registerBody = await registerRes.json().catch(() => null)
  check('banco responde (escrita via registro de organização)', registerRes.status === 201, JSON.stringify(registerBody))

  const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginBody = await loginRes.json().catch(() => null)
  const token = loginBody?.data?.accessToken
  check('login funciona', loginRes.status === 200 && Boolean(token), JSON.stringify(loginBody))

  // 4. Criação de conversa funciona
  const convRes = await fetch(`${API_URL}/api/v1/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ customer: { name: 'Cliente Smoke Test' } }),
  })
  const convBody = await convRes.json().catch(() => null)
  check('criação de conversa funciona', convRes.status === 201, JSON.stringify(convBody))

  if (failures > 0) {
    console.error(`\n${failures} smoke test(s) falharam.`)
    process.exitCode = 1
    return
  }
  console.log('\nTodos os smoke tests passaram.')
}

main().catch((err) => {
  console.error('Smoke test falhou com erro inesperado:', err)
  process.exitCode = 1
})
