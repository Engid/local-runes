/**
 * Local Runes - A Svelte wrapper for TinyBase
 * Provides fine-grained reactivity for TinyBase data in Svelte 5 applications
 * @module local-runes
 */

// Import all exports from the TinyBase Svelte wrapper
import tinybaseSvelte, {
  store,
  getRowIds,
  getRow,
  addRow,
  updateRow,
  deleteRow,
  toggleValue,
  tablesMap
} from './tinybase.svelte';

// Export all named exports
export {
  store,
  getRowIds,
  getRow,
  addRow,
  updateRow,
  deleteRow,
  toggleValue,
  tablesMap
};

// Export types for TypeScript users
export type {
  TableRowData,
  ReactiveRowMap,
  ReactiveTablesMap,
  TinyBaseSvelteAPI
} from './tinybase.svelte';

// Default export of the entire API object
export default tinybaseSvelte;
