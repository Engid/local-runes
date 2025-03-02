// tinybase.svelte.ts
import { createStore, type GetIdChanges, type Store } from "tinybase";
import { createLocalPersister, type LocalPersister } from "tinybase/persisters/persister-browser";
import { createSubscriber } from "svelte/reactivity";
import { SvelteMap } from "svelte/reactivity";

// Define types for our reactive tables data structure
export type TableRowData = Record<string, any>;
export type ReactiveRowMap = SvelteMap<string, TableRowData>;
export type ReactiveTablesMap = SvelteMap<string, ReactiveRowMap>;

/**
 * TinyBase Svelte Wrapper API
 */
export interface TinyBaseSvelteAPI {
  /** The underlying TinyBase store instance */
  store: Store;
  /** Get a reactive array of row IDs for a table */
  getRowIds: (tableId: string) => string[];
  /** Get a reactive row object by ID */
  getRow: <T extends object = any>(tableId: string, rowId: string) => T;
  /** Add a new row to a table */
  addRow: (tableId: string, rowData: TableRowData) => string | undefined;
  /** Update an existing row with partial data */
  updateRow: (tableId: string, rowId: string, changes: TableRowData) => void;
  /** Delete a row from a table */
  deleteRow: (tableId: string, rowId: string) => void;
  /** Toggle a boolean value in a table cell or global store value */
  toggleValue: (tableId: string, rowId?: string, cellId?: string) => void;
}

/// TinyBase store initialization and local persistence setup
export const store = createStore();
// Create a local-storage persister for the store (keyed by app name "tinybase_app")
let persister: LocalPersister;
if (typeof window !== "undefined") {
  // Only attach persistence in browser
  persister = createLocalPersister(store, "tinybase_app");
  // Start automatic loading (with empty initial data if none saved) and saving
  persister.startAutoLoad([{}, {}]).then(() => {
    persister.startAutoSave();
  });
}
// The SvelteMap to hold reactive data for each TinyBase table (tableId -> Map of rows)
const tablesMap: ReactiveTablesMap = new SvelteMap<string, ReactiveRowMap>();

// Utility: ensure a SvelteMap exists for a given table and attach listeners for row add/remove
function ensureTableMap(tableId: string): ReactiveRowMap {
  if (!tablesMap.has(tableId)) {
    // Initialize SvelteMap for this table's rows
    const rowMap: ReactiveRowMap = new SvelteMap<string, TableRowData>();
    tablesMap.set(tableId, rowMap);

    // Attach a listener to track row IDs changes (rows added or removed in this table)
    store.addRowIdsListener(tableId, (_store, tId, newRowIds: GetIdChanges | undefined) => {
      // During initial listener registration, newRowIds is undefined.
      // We only want to process actual changes, not the initial callback.
      if (!newRowIds) return;

      // Convert TinyBase's row IDs array to a set for easy lookup
      const newIdsSet = new Set(store.getRowIds(tableId));
      // Remove any rows from rowMap that no longer exist in TinyBase
      for (const existingId of rowMap.keys()) {
        if (!newIdsSet.has(existingId)) {
          rowMap.delete(existingId);
        }
      }
      // Add any new rows that TinyBase has but rowMap doesn't
      for (const id of newIdsSet) {
        if (!rowMap.has(id)) {
          const rowData = store.getRow(tId, id) ?? {};
          rowMap.set(id, rowData);
        }
      }
    });
  }
  return tablesMap.get(tableId)!;
}

/// Reactive getters using Svelte's createSubscriber

/**
 * Get a reactive array of all row IDs in a table.
 * Usage: in a component, call getRowIds(table) to iterate through current row IDs reactively.
 * @param tableId - The ID of the table to get row IDs from
 * @returns An array of row IDs, or an empty array if the table doesn't exist
 */
export function getRowIds(tableId: string): string[] {
  // Guard against undefined or empty tableId
  if (!tableId) {
    console.warn("getRowIds called with invalid tableId");
    return [];
  }

  // Use createSubscriber to update whenever row IDs in this table change
  const subscribeToRowIds = createSubscriber((update) => {
    const listenerId = store.addRowIdsListener(tableId, () => update());
    return () => store.delListener(listenerId);
  });
  subscribeToRowIds(); // register the subscriber in reactive context
  // Return the current list of row IDs
  return store.getRowIds(tableId) || [];
}

/**
 * Get a reactive row object from a table by ID.
 * The returned object will reflect the current cell values of the row and update reactively.
 * @param tableId - The ID of the table containing the row
 * @param rowId - The ID of the row to get
 * @returns The row data as an object, or an empty object if the row doesn't exist
 */
export function getRow<T extends object = any>(tableId: string, rowId: string): T {
  // Guard against undefined inputs
  if (!tableId || !rowId) {
    console.warn("getRow called with invalid tableId or rowId");
    return {} as T;
  }

  // Ensure the SvelteMap for this table is initialized (for consistency with tableMap usage)
  const rowMap = ensureTableMap(tableId);

  // Use createSubscriber to update whenever this specific row changes
  const subscribeToRow = createSubscriber((update) => {
    const listenerId = store.addRowListener(tableId, rowId, (_store, tId, rId) => {
      // Update the SvelteMap with the new row data (or remove if row was deleted)
      const updatedRow = store.getRow(tId, rId);
      if (updatedRow === undefined) {
        rowMap.delete(rId);
      } else {
        rowMap.set(rId, updatedRow);
      }
      update(); // trigger Svelte to re-run any effects using this row
    });
    return () => store.delListener(listenerId);
  });
  subscribeToRow(); // register subscription if in reactive context

  // Return the current row data (empty object if missing)
  return (store.getRow(tableId, rowId) || {}) as T;
}

/**
 * Add a new row to a TinyBase table.
 * @param tableId - The ID of the table to add the row to
 * @param rowData - An object containing the initial data for the row
 * @returns The ID of the newly created row, or undefined if creation failed
 */
export function addRow(tableId: string, rowData: TableRowData): string | undefined {
  if (!tableId) {
    console.warn("addRow called with invalid tableId");
    return undefined;
  }

  const rowId = store.addRow(tableId, rowData);
  if (rowId) {
    // If a new row was added, ensure it's added to the reactive SvelteMap as well
    const rowMap = ensureTableMap(tableId);
    rowMap.set(rowId, store.getRow(tableId, rowId) ?? rowData);
  }
  return rowId;
}

/**
 * Update an existing row with partial data.
 * Only the specified cells in `changes` will be updated; other cells remain untouched.
 * @param tableId - The ID of the table containing the row
 * @param rowId - The ID of the row to update
 * @param changes - An object containing the cell values to update
 */
export function updateRow(tableId: string, rowId: string, changes: TableRowData): void {
  if (!tableId || !rowId) {
    console.warn("updateRow called with invalid tableId or rowId");
    return;
  }

  store.setPartialRow(tableId, rowId, changes);
  // No need to manually update rowMap here; the TinyBase listener on that row will handle it.
}

/**
 * Delete a row from a TinyBase table.
 * @param tableId - The ID of the table containing the row
 * @param rowId - The ID of the row to delete
 */
export function deleteRow(tableId: string, rowId: string): void {
  if (!tableId || !rowId) {
    console.warn("deleteRow called with invalid tableId or rowId");
    return;
  }

  store.delRow(tableId, rowId);
  // The rowIds listener will remove it from the SvelteMap automatically.
  // Also, any row-specific listeners for this ID will get triggered and then removed on teardown.
}

/**
 * Toggle a boolean value.
 * If tableId, rowId, and cellId are provided, toggles the specified cell value.
 * If only tableId is provided, it's treated as a valueId and toggles that global value.
 * If the value is not a boolean, no operation is performed.
 *
 * @param tableId - The table ID (or value ID if used alone)
 * @param rowId - Optional row ID when toggling a cell
 * @param cellId - Optional cell ID when toggling a cell
 */
export function toggleValue(tableId: string, rowId?: string, cellId?: string): void {
  if (!tableId) {
    console.warn("toggleValue called with invalid tableId/valueId");
    return;
  }

  if (rowId !== undefined && cellId !== undefined) {
    // Toggling a cell in a table row
    const current = store.getCell(tableId, rowId, cellId);
    if (typeof current === "boolean") {
      store.setCell(tableId, rowId, cellId, !current);
    } else {
      console.warn(`Cell value at table: ${tableId}, row: ${rowId}, cell: ${cellId} is not a boolean`);
    }
  } else {
    // Toggling a global value (no row specified)
    const valueId = tableId;
    const current = store.getValue(valueId);
    if (typeof current === "boolean") {
      store.setValue(valueId, !current);
    } else {
      console.warn(`Value ${valueId} is not a boolean`);
    }
  }
}

// You can optionally export the tablesMap for direct reactive access to all tables,
// or use getRowIds and getRow for finer control.
export { tablesMap };

// Default export: an object consolidating the API that matches the TinyBaseSvelteAPI interface
const tinybaseSvelte: TinyBaseSvelteAPI = {
  store,
  getRowIds,
  getRow,
  addRow,
  updateRow,
  deleteRow,
  toggleValue,
};

export default tinybaseSvelte;
