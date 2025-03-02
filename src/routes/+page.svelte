<script lang="ts">
  import tinybase from '$lib/tinybase.svelte';  // adjust path as needed
  import { getRowIds, getRow, addRow, toggleValue, updateRow } from '$lib/tinybase.svelte';

  // For example, manage a list of todos
  const table = 'todos';

  // State for new todo input
  let newTodoText = '';

  // Add a new todo
  function addTodo() {
    if (newTodoText.trim()) {
      addRow(table, { text: newTodoText, done: false });
      newTodoText = ''; // Clear input after adding
    }
  }

  // Handle text editing
  function updateTodoText(id: string, text: string) {
    if (text.trim()) {
      updateRow(table, id, { text });
    }
  }
</script>

<h2>Todo List</h2>

<div>
  <input 
    type="text" 
    bind:value={newTodoText}
    placeholder="What needs to be done?"
  />
  <button on:click={addTodo}>Add Todo</button>
</div>

<ul>
  {#each getRowIds(table) as id}
    {@const todo = getRow(table, id)}
    <li>
      <input 
        type="checkbox" 
        bind:checked={todo.done} 
        on:change={() => toggleValue(table, id, 'done')} 
      />
      <input 
        type="text"
        value={todo.text}
        on:change={(e) => updateTodoText(id, e.currentTarget.value)}
      />
      <button on:click={() => tinybase.deleteRow(table, id)}>Delete</button>
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin: 0.5rem 0;
  }
  input[type="text"] {
    padding: 0.25rem;
  }
  .completed {
    text-decoration: line-through;
    opacity: 0.6;
  }
</style>
