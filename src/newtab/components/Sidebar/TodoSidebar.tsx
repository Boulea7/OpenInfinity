/**
 * TodoSidebar Component
 *
 * Full-featured todo management sidebar with priority support,
 * tag highlighting, and completed items section.
 */

import { useState, useCallback, useMemo } from 'react';
import { CheckSquare, Square, Plus, Trash2, Edit2, Flag } from 'lucide-react';
import { useTodos, type TodoPriority } from '../../hooks';
import { cn } from '../../utils';
import type { TodoItem } from '../../services/database';

type Priority = TodoPriority;

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: '高', color: 'text-red-500', bg: 'bg-red-500/10' },
  medium: { label: '中', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { label: '低', color: 'text-green-500', bg: 'bg-green-500/10' },
  none: { label: '无', color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
};

/**
 * Generate consistent HSL color from string hash
 * Uses fixed saturation/lightness for good contrast and readability
 */
function hashToHSL(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  // Fixed saturation 70%, lightness 45% for good contrast on both light/dark backgrounds
  return `hsl(${h}, 70%, 45%)`;
}

/**
 * Render text with highlighted tags (each tag gets unique color based on name)
 */
function renderTextWithTags(text: string): React.ReactNode {
  // Match #tags with Unicode support for CJK characters
  const parts = text.split(/(#[\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff-]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      const color = hashToHSL(part);
      return (
        <span
          key={index}
          className="cursor-pointer font-medium hover:underline"
          style={{ color }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function TodoSidebar() {
  // Always include completed items in sidebar (different from widget behavior)
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted } = useTodos({ includeCompleted: true });
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Split todos into active and completed
  const { activeTodos, completedTodos } = useMemo(() => {
    const active: TodoItem[] = [];
    const completed: TodoItem[] = [];

    todos.forEach(todo => {
      if (todo.done) {
        completed.push(todo);
      } else {
        active.push(todo);
      }
    });

    // Sort active by priority (high > medium > low > none)
    const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };
    active.sort((a, b) => {
      const aPriority: Priority = (a.priority as Priority) || 'none';
      const bPriority: Priority = (b.priority as Priority) || 'none';
      const byPriority = priorityOrder[aPriority] - priorityOrder[bPriority];
      if (byPriority !== 0) return byPriority;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

    // Sort completed by update time (newest first)
    completed.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

    return { activeTodos: active, completedTodos: completed };
  }, [todos]);

  // Handle add todo
  const handleAddTodo = useCallback(async () => {
    if (newTodoText.trim()) {
      try {
        await addTodo(newTodoText.trim(), newTodoPriority);
        setNewTodoText('');
        setNewTodoPriority('medium');
      } catch (error) {
        console.error('Failed to add todo:', error);
      }
    }
  }, [newTodoText, newTodoPriority, addTodo]);

  // Handle toggle todo
  const handleToggleTodo = useCallback(async (id: string) => {
    try {
      await toggleTodo(id);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  }, [toggleTodo]);

  // Handle delete todo
  const handleDeleteTodo = useCallback(async (id: string) => {
    try {
      await deleteTodo(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  }, [deleteTodo]);

  // Handle edit save
  const handleSaveEdit = useCallback(async (id: string) => {
    if (editingText.trim()) {
      try {
        await updateTodo(id, { text: editingText.trim() });
      } catch (error) {
        console.error('Failed to update todo:', error);
      }
    }
    setEditingId(null);
    setEditingText('');
  }, [editingText, updateTodo]);

  // Render todo item
  const renderTodoItem = (todo: TodoItem) => (
    <div
      key={todo.id}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group',
        todo.done && 'opacity-60'
      )}
    >
      <button
        onClick={() => handleToggleTodo(todo.id)}
        className="mt-0.5 text-gray-400 hover:text-blue-500 transition-colors"
      >
        {todo.done ? (
          <CheckSquare className="w-5 h-5 text-blue-500" />
        ) : (
          <Square className="w-5 h-5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {editingId === todo.id ? (
          <input
            type="text"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit(todo.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
            onBlur={() => handleSaveEdit(todo.id)}
            className="w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
            autoFocus
          />
        ) : (
          <div
            onClick={() => {
              if (!todo.done) {
                setEditingId(todo.id);
                setEditingText(todo.text);
              }
            }}
            className={cn(
              'text-gray-900 dark:text-gray-100 cursor-pointer',
              todo.done && 'line-through text-gray-500'
            )}
          >
            {renderTextWithTags(todo.text)}
          </div>
        )}

        {/* Priority badge */}
        {todo.priority && todo.priority !== 'medium' && (
          <div className="mt-1">
            {(() => {
              const config = PRIORITY_CONFIG[todo.priority as Priority];
              return (
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded',
                  config.bg,
                  config.color
                )}>
                  <Flag className="w-3 h-3" />
                  {config.label}
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!todo.done && (
          <button
            onClick={() => {
              setEditingId(todo.id);
              setEditingText(todo.text);
            }}
            className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => handleDeleteTodo(todo.id)}
          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {/* Add Todo Form */}
      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="添加新待办... 使用 #标签 分类"
            className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddTodo}
            disabled={!newTodoText.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Priority selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">优先级:</span>
          {(['high', 'medium', 'low', 'none'] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setNewTodoPriority(p)}
              className={cn(
                'px-3 py-1 rounded-full transition-colors',
                newTodoPriority === p
                  ? cn(PRIORITY_CONFIG[p].bg, PRIORITY_CONFIG[p].color)
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Todos */}
      <div className="space-y-1">
        {activeTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无待办事项</p>
            <p className="text-sm mt-1">使用上方输入框添加</p>
          </div>
        ) : (
          activeTodos.map(renderTodoItem)
        )}
      </div>

      {/* Completed Section */}
      {completedTodos.length > 0 && (
        <div className="border-t dark:border-gray-700 pt-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-2"
          >
            <span>已完成 ({completedTodos.length})</span>
          </button>

          {showCompleted && (
            <>
              <div className="space-y-1">
                {completedTodos.map(renderTodoItem)}
              </div>
              <button
                onClick={clearCompleted}
                className="mt-3 w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                清除所有已完成
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TodoSidebar;
