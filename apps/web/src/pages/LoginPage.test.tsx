import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../test/render'
import { LoginPage } from './LoginPage'
import { api, ApiError } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  }
})

function renderLoginPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<div>Home Page</div>} />
    </Routes>,
    { route: '/login' },
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  it('renderiza o formulário de login', () => {
    renderLoginPage()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('login válido armazena o token e navega para o dashboard', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValue({
      data: {
        accessToken: 'jwt-token',
        user: { id: 'usr_1', name: 'Ana Silva', email: 'ana@example.com' },
        organization: { id: 'org_1', name: 'Acme Support' },
        role: 'owner',
      },
    })
    vi.mocked(api.get).mockResolvedValue({
      data: {
        user: { id: 'usr_1', name: 'Ana Silva', email: 'ana@example.com' },
        organization: { id: 'org_1', name: 'Acme Support' },
        role: 'owner',
        permissions: ['conversations.read'],
      },
    })

    renderLoginPage()
    await user.type(screen.getByLabelText(/email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'strong-password')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument())
    expect(localStorage.getItem('token')).toBe('jwt-token')
  })

  it('401 exibe mensagem genérica, sem revelar se o email existe', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValue(new ApiError(401, 'Invalid credentials'))

    renderLoginPage()
    await user.type(screen.getByLabelText(/email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Email ou senha inválidos.')).toBeInTheDocument()
  })

  it('429 exibe mensagem de rate limit', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValue(new ApiError(429, 'Too many requests'))

    renderLoginPage()
    await user.type(screen.getByLabelText(/email/i), 'ana@example.com')
    await user.type(screen.getByLabelText(/senha/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/muitas tentativas/i)).toBeInTheDocument()
  })
})
