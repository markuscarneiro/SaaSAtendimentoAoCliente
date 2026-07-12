import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'

interface RenderOptions {
  route?: string
  // When set, wraps `ui` in a <Route path={path}> so useParams() resolves inside the component.
  path?: string
}

export function renderWithProviders(ui: ReactElement, { route = '/', path }: RenderOptions = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{path ? <Routes><Route path={path} element={ui} /></Routes> : ui}</AuthProvider>
    </MemoryRouter>,
  )
}
