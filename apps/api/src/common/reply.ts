export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return { data, meta, error: null }
}

export function errorEnvelope(
  code: string,
  message: string,
  details: unknown[] = [],
) {
  return { data: null, meta: {}, error: { code, message, details } }
}
