import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Vitest doesn't run with jest-like globals, so Testing Library's automatic
// cleanup detection doesn't kick in — unmount the DOM after each test manually.
afterEach(() => {
  cleanup()
})

// jsdom does not implement scrollIntoView — stub it so components that call it don't throw.
window.HTMLElement.prototype.scrollIntoView = vi.fn()
