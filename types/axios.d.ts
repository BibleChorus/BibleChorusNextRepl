import 'axios';

declare module 'axios' {
  // Override the default generic for AxiosResponse so that `response.data` is `any`
  // when a specific type parameter isn't supplied. This prevents the slew of
  // `TS18046: 'response.data' is of type 'unknown'` errors throughout the codebase
  // without forcing every call site to specify a generic.
  export interface AxiosResponse<T = any, D = any> {
    data: T;
  }

  // Minimal typing to satisfy our usage without pulling in full axios types
  export interface AxiosError<T = any> extends Error {
    response?: {
      status?: number;
      data?: T;
    };
    request?: any;
    config?: any;
    isAxiosError: boolean;
  }

  // Type predicate for runtime check
  // Even if not present in the installed type declarations, axios does expose this function.
  // eslint-disable-next-line @typescript-eslint/ban-types
  export function isAxiosError(payload: unknown): payload is AxiosError;
}

export {};