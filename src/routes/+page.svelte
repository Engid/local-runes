<script lang="ts">
  import tinybase from '$lib/tinybase.svelte';  // adjust path as needed
  import { getRowIds, getRow, addRow, toggleValue } from '$lib/tinybase.svelte';

  // For example, manage a list of todos
  const table = 'todos';

  // Add a new todo for demonstration
  function addSampleTodo() {
    addRow(table, { text: 'Learn Svelte 5 with TinyBase', done: false });
  }
</script>

<h2>Todo List</h2>
<button on:click={addSampleTodo}>Add a sample todo</button>
<ul>
  {#each getRowIds(table) as id}
    <!-- Each todo row is subscribed individually via getRow -->
    {@const todo = getRow(table, id)}
    <li>
      {todo.text}
      <input type="checkbox" bind:checked={todo.done} on:change={() => toggleValue(table, id, 'done')} />
      <button on:click={() => tinybase.deleteRow(table, id)}>Delete</button>
    </li>
  {/each}
</ul>
