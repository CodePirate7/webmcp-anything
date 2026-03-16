import { useTodoStore } from './store/todo-store';
import { useTodoTools } from './webmcp/modules/todo-tools';
import { useState } from 'react';

export function App() {
  // Register MCP Tools — they mount when App mounts, unmount when it unmounts
  useTodoTools();

  const { todos, addTodo, toggleTodo, deleteTodo, clearCompleted } =
    useTodoStore();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    addTodo(title);
    setInput('');
  };

  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Todo App</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        webmcp-anything example — AI agents can operate this app via MCP Tools
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="What needs to be done?"
          style={{ flex: 1, padding: '8px 12px', fontSize: 16 }}
        />
        <button onClick={handleAdd} style={{ padding: '8px 16px' }}>
          Add
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              style={{
                flex: 1,
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? '#999' : '#333',
              }}
            >
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{ color: '#999', border: 'none', cursor: 'pointer' }}
            >
              x
            </button>
          </li>
        ))}
      </ul>

      {total > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 12,
            fontSize: 14,
            color: '#666',
          }}
        >
          <span>
            {active} active, {completed} completed
          </span>
          {completed > 0 && (
            <button
              onClick={clearCompleted}
              style={{ color: '#999', border: 'none', cursor: 'pointer' }}
            >
              Clear completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
