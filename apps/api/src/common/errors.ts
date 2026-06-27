export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function conflict(message: string): AppError {
  return new AppError(409, 'CONFLICT', message)
}

export function unauthenticated(message = 'Authentication required'): AppError {
  return new AppError(401, 'UNAUTHENTICATED', message)
}

export function forbidden(message = 'Insufficient permissions'): AppError {
  return new AppError(403, 'FORBIDDEN', message)
}

export function notFound(message = 'Resource not found'): AppError {
  return new AppError(404, 'NOT_FOUND', message)
}

export function rateLimited(message = 'Too many requests. Try again later.'): AppError {
  return new AppError(429, 'RATE_LIMITED', message)
}

export function validationError(message: string, details?: unknown[]): AppError {
  return new AppError(400, 'VALIDATION_ERROR', message, details)
}
