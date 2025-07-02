import 'axios';

declare module 'axios' {
  // Override the default generic for AxiosResponse so that `response.data` is `any`
  // when a specific type parameter isn't supplied. This prevents the slew of
  // `TS18046: 'response.data' is of type 'unknown'` errors throughout the codebase
  // without forcing every call site to specify a generic.
  export interface AxiosResponse<T = any, D = any> {
    data: T;
  }
}

export {};