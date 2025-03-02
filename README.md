# Local Runes ✨🔮🗿🌟

A [Svelte](https://svelte.dev/) wrapper for local-first data storage, powered by [TinyBase](https://tinybase.org/).
This uses [Runes](https://svelte.dev/docs/svelte/what-are-runes) introduced in Svelte 5.

> ⚠️ **Warning**: This is experimental software and the API is subject to change. Use at your own risk.

## Why?

I have enjoyed using TinyBase, and prefer to use Svelte over React, so I am trying to write a wrapper.
This is a fun thing, and not serious yet. Don't judge me.

## Installation

```bash
npm install local-runes
```

## Basic Usage

```svelte
<script lang="ts">
  import tinybase from 'local-runes';
  import { getRowIds, getRow, addRow, toggleValue } from 'local-runes';

  // Define a table to work with
  const todoTable = 'todos';

  // Add a new todo
  function addTodo(text) {
    addRow(todoTable, { text, done: false });
  }
</script>

<h1>Todo List</h1>
<input bind:value={newTodo} />
<button on:click={() => addTodo(newTodo)}>Add Todo</button>

<ul>
  {#each getRowIds(todoTable) as id}
    {@const todo = getRow(todoTable, id)}
    <li>
      <input type="checkbox"
        checked={todo.done}
        on:change={() => toggleValue(todoTable, id, 'done')}
      />
      {todo.text}
      <button on:click={() => tinybase.deleteRow(todoTable, id)}>Delete</button>
    </li>
  {/each}
</ul>
```

## API Quick Reference

| Function                              | Description                                              |
| ------------------------------------- | -------------------------------------------------------- |
| `getRowIds(tableId)`                  | Get a reactive array of row IDs in a table               |
| `getRow(tableId, rowId)`              | Get a reactive row object that updates when data changes |
| `addRow(tableId, rowData)`            | Add a new row to a table and return its ID               |
| `updateRow(tableId, rowId, changes)`  | Update an existing row with partial data                 |
| `deleteRow(tableId, rowId)`           | Delete a row from a table                                |
| `toggleValue(tableId, rowId, cellId)` | Toggle a boolean cell value                              |
| `toggleValue(valueId)`                | Toggle a boolean global store value                      |
| `tablesMap`                           | Direct access to the reactive tables collection          |
| `store`                               | Access to the underlying TinyBase store                  |

All reactive getters automatically set up and clean up subscriptions when components mount/unmount.

## Packaging for NPM

To prepare this library for npm:

1. Ensure `package.json` has the correct configuration:

```json
{
  "name": "local-runes",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "svelte": "^5.0.0",
    "tinybase": "^4.0.0"
  }
}
```

2. Build the package using:

```bash
npm run build
```

3. Publish to npm:

```bash
npm publish
```

## Contributing

Please feel free to make PRs or issues, but I have limited time to address concerns so please be patient.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Please see these pages for additional license information:

- [TinyBase](https://github.com/tinyplex/tinybase?tab=MIT-1-ov-file#readme)
- [Svelte](https://github.com/sveltejs/svelte?tab=MIT-1-ov-file#readme)
