import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number for display with fixed decimals; handles non-finite values. */
export function fmt(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
  const s = x.toFixed(digits);
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
}

/** Format a p-value the way journals expect (APA/AMA style). */
export function fmtP(p: number): string {
  if (!Number.isFinite(p)) return '—';
  if (p < 0.001) return '<0.001';
  if (p > 0.99) return '>0.99';
  return p < 0.01 ? p.toFixed(3) : p.toFixed(2);
}

export function pct(x: number, digits = 0): string {
  if (!Number.isFinite(x)) return '—';
  return `${(x * 100).toFixed(digits)}%`;
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Defer heavy synchronous work so the UI can paint a "running" state first. */
export function defer<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, 16);
  });
}
