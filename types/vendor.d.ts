/*
 * Fallback type declarations for third-party libraries that do not ship with
 * their own TypeScript typings or whose typings might be missing in the local
 * environment.  These are intentionally minimal – just enough for the
 * compiler to recognise the modules and let the application build.  Replace
 * them with more specific definitions if you need stronger type safety later.
 */

declare module 're-resizable' {
  import * as React from 'react'

  export interface ResizableProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultSize?: {
      width: number | string
      height: number | string
    }
    minWidth?: number | string
    maxWidth?: number | string
    minHeight?: number | string
    maxHeight?: number | string
    enable?: { [key: string]: boolean }
    onResizeStart?: (
      event: MouseEvent | TouchEvent,
      direction: string,
      ref: HTMLElement
    ) => void
    onResize?: (
      event: MouseEvent | TouchEvent,
      direction: string,
      ref: HTMLElement,
      delta: { width: number; height: number }
    ) => void
    onResizeStop?: (
      event: MouseEvent | TouchEvent,
      direction: string,
      ref: HTMLElement,
      delta: { width: number; height: number }
    ) => void
  }

  export const Resizable: React.FC<ResizableProps>
  export default Resizable
}

// Axios already ships its own typings, but in case the environment cannot
// resolve them we add a minimal fallback.

// ---------------------------------------------------------------------------
// Additional fallback modules to prevent TypeScript "cannot find module" errors
// for environments where the full type packages cannot be resolved.
// These are intentionally very light – they only provide the bare minimum
// so the compiler can continue.  Replace or augment them with the official
// typings if/when they are installed via `@types/*` or the library ships
// its own definitions.

// Head from Next.js is just a React component with children.
// declare module 'next/head' {
//   import * as React from 'react';
//   const Head: React.ComponentType<React.PropsWithChildren<unknown>>;
//   export default Head;
// }

// Very thin fallback for Recharts – we only need the named components we use.
// declare module 'recharts' {
//   import * as React from 'react';
//   export const BarChart: React.ComponentType<any>;
//   export const Bar: React.ComponentType<any>;
//   export const CartesianGrid: React.ComponentType<any>;
//   export const XAxis: React.ComponentType<any>;
//   export const YAxis: React.ComponentType<any>;
//   export const Tooltip: React.ComponentType<any>;
//   export const Cell: React.ComponentType<any>;
// }

// Basic stub for framer-motion.  Most of the time the real typings will be
// resolved, but this prevents hard failures if they're not available.
// declare module 'framer-motion' {
//   import * as React from 'react';
//   export const motion: { [key: string]: React.ComponentType<any> };
//   export const AnimatePresence: React.ComponentType<any>;
// }
// ---------------------------------------------------------------------------

// Removed fallback stubs for React-related libraries – the project now relies on
// the official `@types/*` packages that are listed in `devDependencies`.
// ---------------------------------------------------------------------------