declare module 'sonner' {
  import type { FC } from 'react';

  export interface ToastOptions {
    title?: string;
    description?: string;
    duration?: number;
    [key: string]: any;
  }

  export type ToastFn = (message: string, options?: ToastOptions) => void;

  export interface ToastAPI extends ToastFn {
    success: ToastFn;
    error: ToastFn;
    info: ToastFn;
    dismiss: () => void;
  }

  export const toast: ToastAPI;
  export const success: ToastFn;
  export const error: ToastFn;
  export const info: ToastFn;

  export interface ToasterProps {
    theme?: 'light' | 'dark' | 'system';
    richColors?: boolean;
    position?: string;
    className?: string;
    toastOptions?: any;
  }

  export const Toaster: FC<ToasterProps>;
}