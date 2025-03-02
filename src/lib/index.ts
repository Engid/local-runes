/**
 * Local Runes - A Svelte wrapper for TinyBase
 * Provides fine-grained reactivity for TinyBase data in Svelte 5 applications
 */

// Export everything from the TinyBase Svelte wrapper
export * from './tinybase.svelte';
export { default } from './tinybase.svelte';

// Export types for TypeScript users
export type {
  TableRowData,
  ReactiveRowMap,
  ReactiveTablesMap,
  TinyBaseSvelteAPI
} from './tinybase.svelte';
