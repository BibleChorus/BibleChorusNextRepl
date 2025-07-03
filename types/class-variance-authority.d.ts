declare module 'class-variance-authority' {
  import { ClassValue } from 'clsx';

  /**
   * Utility function that returns a string of class names based on provided variants / props.
   * This is a minimal declaration – for complete typings install the library which
   * already ships its own .d.ts, but this stub satisfies TypeScript in environments
   * where those types are not discovered.
   */
  export function cva(base: string, config?: Record<string, unknown>): (...classes: ClassValue[]) => string;
}