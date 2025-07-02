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

// End of vendor overrides — official @types packages are used for everything else.