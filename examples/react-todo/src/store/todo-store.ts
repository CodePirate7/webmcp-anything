import { create } from 'zustand';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

interface TodoState {
  todos: Todo[];
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
}

let nextId = 1;

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],

  addTodo: (title: string) => {
    const id = `todo-${nextId++}`;
    set((state) => ({
      todos: [
        ...state.todos,
        { id, title, completed: false, createdAt: Date.now() },
      ],
    }));
  },

  toggleTodo: (id: string) => {
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    }));
  },

  deleteTodo: (id: string) => {
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      todos: state.todos.filter((t) => !t.completed),
    }));
  },
}));
