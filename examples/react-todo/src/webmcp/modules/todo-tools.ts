/**
 * Todo Page Tools
 *
 * Follows WEB-HARNESS.md design principles:
 * - Operate state, not DOM (calls Zustand actions)
 * - Read before write (read_todos is first)
 * - Use existing actions (wraps useTodoStore)
 * - One tool, one purpose
 * - Schema is the contract (full descriptions)
 */

import { useWebMCP } from 'usewebmcp';
import { useTodoStore } from '../../store/todo-store';
import { jsonResult, textResult } from '../utils/result-helpers';

// ── Schemas ──

const EMPTY_SCHEMA = {
  type: 'object' as const,
  properties: {},
};

const ADD_TODO_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: {
      type: 'string' as const,
      description: 'The title/content of the todo item to create',
    },
  },
  required: ['title'] as const,
};

const TOGGLE_TODO_SCHEMA = {
  type: 'object' as const,
  properties: {
    id: {
      type: 'string' as const,
      description: 'The ID of the todo item to toggle (e.g., "todo-1")',
    },
  },
  required: ['id'] as const,
};

const DELETE_TODO_SCHEMA = {
  type: 'object' as const,
  properties: {
    id: {
      type: 'string' as const,
      description: 'The ID of the todo item to delete (e.g., "todo-1")',
    },
  },
  required: ['id'] as const,
};

// ── Hook ──

export function useTodoTools() {
  const store = useTodoStore;

  // Read Tool (mandatory — agent's "eyes")
  useWebMCP({
    name: 'read_todos',
    description:
      'Read the current todo list. Returns all todos with their id, title, completed status, and creation time. Always call this before making changes.',
    inputSchema: EMPTY_SCHEMA,
    annotations: { readOnlyHint: true },
    execute: async () => {
      const { todos } = store.getState();
      const total = todos.length;
      const completed = todos.filter((t) => t.completed).length;

      return jsonResult({
        total,
        active: total - completed,
        completed,
        todos: todos.map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          createdAt: new Date(t.createdAt).toISOString(),
        })),
      });
    },
  });

  // Add Tool
  useWebMCP({
    name: 'add_todo',
    description: 'Add a new todo item to the list.',
    inputSchema: ADD_TODO_SCHEMA,
    execute: async (input: { title: string }) => {
      try {
        const title = input.title.trim();
        if (!title) {
          return textResult('Error: title cannot be empty');
        }

        store.getState().addTodo(title);

        const { todos } = store.getState();
        const created = todos[todos.length - 1];

        return jsonResult({
          success: true,
          created: {
            id: created.id,
            title: created.title,
          },
          totalTodos: todos.length,
        });
      } catch (error) {
        return textResult(`Error: ${String(error)}`);
      }
    },
  });

  // Toggle Tool
  useWebMCP({
    name: 'toggle_todo',
    description:
      'Toggle a todo item between completed and active. Use read_todos first to get the todo ID.',
    inputSchema: TOGGLE_TODO_SCHEMA,
    execute: async (input: { id: string }) => {
      try {
        const { todos } = store.getState();
        const todo = todos.find((t) => t.id === input.id);

        if (!todo) {
          return textResult(
            `Error: todo "${input.id}" not found. Call read_todos to see available IDs.`,
          );
        }

        store.getState().toggleTodo(input.id);

        const updated = store.getState().todos.find((t) => t.id === input.id)!;

        return jsonResult({
          success: true,
          todo: {
            id: updated.id,
            title: updated.title,
            completed: updated.completed,
          },
        });
      } catch (error) {
        return textResult(`Error: ${String(error)}`);
      }
    },
  });

  // Delete Tool
  useWebMCP({
    name: 'delete_todo',
    description:
      'Delete a todo item by ID. Use read_todos first to get the todo ID.',
    inputSchema: DELETE_TODO_SCHEMA,
    execute: async (input: { id: string }) => {
      try {
        const { todos } = store.getState();
        const todo = todos.find((t) => t.id === input.id);

        if (!todo) {
          return textResult(
            `Error: todo "${input.id}" not found. Call read_todos to see available IDs.`,
          );
        }

        store.getState().deleteTodo(input.id);

        return jsonResult({
          success: true,
          deleted: { id: todo.id, title: todo.title },
          remainingTodos: store.getState().todos.length,
        });
      } catch (error) {
        return textResult(`Error: ${String(error)}`);
      }
    },
  });

  // Clear Completed Tool
  useWebMCP({
    name: 'clear_completed_todos',
    description:
      'Remove all completed todo items from the list. Only affects items where completed=true.',
    inputSchema: EMPTY_SCHEMA,
    execute: async () => {
      try {
        const before = store.getState().todos.length;
        const completedCount = store
          .getState()
          .todos.filter((t) => t.completed).length;

        if (completedCount === 0) {
          return textResult('No completed todos to clear.');
        }

        store.getState().clearCompleted();

        return jsonResult({
          success: true,
          removed: completedCount,
          remaining: store.getState().todos.length,
          beforeTotal: before,
        });
      } catch (error) {
        return textResult(`Error: ${String(error)}`);
      }
    },
  });
}
