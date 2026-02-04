# React Query Devtools in IASO

## Purpose
- Inspect React Query cache, query/mutation status, and retry/fetch history directly in the browser.

## How to activate
1. Open the IASO app in your browser and open the browser console.
2. Run `window.showReactQueryDevtools?.()` to inject the React Query Devtools UI (it appears closed by default).
3. If you want to remove it, run `window.hideReactQueryDevtools?.()`.
