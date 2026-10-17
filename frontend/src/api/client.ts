/**
 * API INTEGRATION BOUNDARY (placeholder)
 *
 * No real backend is connected yet and no endpoints are defined here on purpose.
 * When the backend is ready, implement the functions in `services/*` against it
 * using a client created in this folder. Pages and components only ever import
 * from `@/services`, so they do not need to change.
 *
 * Configuration comes from Vite env vars (see `.env.example`). Never commit
 * secrets or API keys to this repository.
 */
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false',
} as const

export class ServiceError extends Error {
  readonly code: 'unauthorized' | 'not_found' | 'validation' | 'unknown'
  constructor(message: string, code: ServiceError['code'] = 'unknown') {
    super(message)
    this.name = 'ServiceError'
    this.code = code
  }
}

/** Simulates network latency for mock services. Remove with the mocks. */
export const mockLatency = <T,>(value: T, ms = 450): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms))
