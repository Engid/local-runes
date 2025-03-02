import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { store, getRowIds, getRow, addRow, updateRow, deleteRow, toggleValue } from "./tinybase.svelte";
import { createStore } from "tinybase";
import * as svelteReactivity from "svelte/reactivity";

// Mock Svelte's reactivity APIs
vi.mock("svelte/reactivity", async () => {
  const actual = await vi.importActual("svelte/reactivity");

  // Create a mock SvelteMap that mimics the behavior we need for testing
  class MockSvelteMap extends Map {
    set(key: string, value: unknown) {
      // Add spy functionality if needed
      return super.set(key, value);
    }
    delete(key: string) {
      // Add spy functionality if needed
      return super.delete(key);
    }
  }

  return {
    ...actual,
    createSubscriber: vi.fn((setupFn) => {
      const update = vi.fn();
      const teardown = setupFn(update);
      return () => {
        update(); // Simulate initial subscription
        return teardown;
      };
    }),
    SvelteMap: MockSvelteMap,
  };
});

// Mock browser localStorage for persister tests
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("TinyBase Svelte Wrapper", () => {
  const TEST_TABLE = "test_table";

  // Reset the store before each test
  beforeEach(() => {
    store.delTables();
  });

  describe("getRowIds", () => {
    it("should return an empty array for a non-existent table", () => {
      expect(getRowIds("nonexistent")).toEqual([]);
    });

    it("should return all row IDs in a table", () => {
      addRow(TEST_TABLE, { name: "Test 1" });
      addRow(TEST_TABLE, { name: "Test 2" });

      expect(getRowIds(TEST_TABLE).length).toBe(2);
    });

    it("should subscribe to row IDs changes via createSubscriber", () => {
      getRowIds(TEST_TABLE);
      expect(svelteReactivity.createSubscriber).toHaveBeenCalled();
    });
  });

  describe("getRow", () => {
    it("should return an empty object for non-existent rows", () => {
      expect(getRow(TEST_TABLE, "nonexistent")).toEqual({});
    });

    it("should return the row data for an existing row", () => {
      const rowId = addRow(TEST_TABLE, { name: "Test", done: false });
      if (rowId) {
        const row = getRow(TEST_TABLE, rowId);
        expect(row).toHaveProperty("name", "Test");
        expect(row).toHaveProperty("done", false);
      }
    });

    it("should subscribe to row changes via createSubscriber", () => {
      const rowId = addRow(TEST_TABLE, { name: "Test" });
      if (rowId) {
        getRow(TEST_TABLE, rowId);
        expect(svelteReactivity.createSubscriber).toHaveBeenCalled();
      }
    });
  });

  describe("addRow", () => {
    it("should add a row to the store and return the row ID", () => {
      const rowId = addRow(TEST_TABLE, { name: "New Test" });

      expect(rowId).toBeDefined();
      expect(typeof rowId).toBe("string");
      expect(store.getRow(TEST_TABLE, rowId as string)).toEqual({ name: "New Test" });
    });
  });

  describe("updateRow", () => {
    it("should update an existing row with new values", () => {
      const rowId = addRow(TEST_TABLE, { name: "Original", count: 0 });
      if (rowId) {
        updateRow(TEST_TABLE, rowId, { count: 1 });

        const updated = store.getRow(TEST_TABLE, rowId);
        expect(updated).toEqual({ name: "Original", count: 1 });
      }
    });

    it("should only update specified properties", () => {
      const rowId = addRow(TEST_TABLE, { name: "Original", count: 0 });
      if (rowId) {
        updateRow(TEST_TABLE, rowId, { name: "Updated" });

        const updated = store.getRow(TEST_TABLE, rowId);
        expect(updated).toEqual({ name: "Updated", count: 0 });
      }
    });
  });

  describe("deleteRow", () => {
    it("should remove a row from the store", () => {
      const rowId = addRow(TEST_TABLE, { name: "To Delete" });
      if (rowId) {
        deleteRow(TEST_TABLE, rowId);

        // In our test environment, TinyBase returns {} for deleted rows
        // This might be due to how TinyBase works in vitest/mock environment
        expect(Object.keys(store.getRow(TEST_TABLE, rowId) || {}).length).toBe(0);

        // Our wrapper also returns an empty object for non-existent rows
        expect(getRow(TEST_TABLE, rowId)).toEqual({});

        // Most importantly, the row should be removed from the row IDs collection
        expect(getRowIds(TEST_TABLE)).not.toContain(rowId);
      }
    });
  });

  describe("toggleValue", () => {
    it("should toggle a boolean cell value", () => {
      const rowId = addRow(TEST_TABLE, { name: "Task", done: false });
      if (rowId) {
        toggleValue(TEST_TABLE, rowId, "done");

        expect(store.getCell(TEST_TABLE, rowId, "done")).toBe(true);

        toggleValue(TEST_TABLE, rowId, "done");
        expect(store.getCell(TEST_TABLE, rowId, "done")).toBe(false);
      }
    });

    it("should toggle a boolean store value", () => {
      store.setValue("darkMode", false);

      toggleValue("darkMode");
      expect(store.getValue("darkMode")).toBe(true);

      toggleValue("darkMode");
      expect(store.getValue("darkMode")).toBe(false);
    });

    it("should not toggle non-boolean values", () => {
      const rowId = addRow(TEST_TABLE, { name: "Task", count: 5 });
      if (rowId) {
        toggleValue(TEST_TABLE, rowId, "count");

        // Should remain unchanged as it's not a boolean
        expect(store.getCell(TEST_TABLE, rowId, "count")).toBe(5);
      }
    });
  });
});
