/**
 * HomeTodoList - Fixed todo list on the right side of homepage
 *
 * Features:
 * - Semi-transparent glassmorphism design
 * - Fixed position on right side
 * - Shows only incomplete todos
 * - Separate from sidebar todo widget
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { useTodos } from '../../hooks';
import type { TodoItem } from '../../services/database';
import { formatDate } from '../../utils';

interface HomeTodoListProps {
  className?: string;
}

export const HomeTodoList: React.FC<HomeTodoListProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  // Only fetch incomplete todos for better performance
  const { todos, toggleTodo } = useTodos();

  // Filter to show only incomplete todos
  const incompleteTodos = useMemo(() => {
    return todos.filter((todo: TodoItem) => !todo.done);
  }, [todos]);

  // Don't render if no incomplete todos
  if (incompleteTodos.length === 0) {
    return (
      <div
        className={`
          fixed right-4 top-1/2 -translate-y-1/2 z-30
          w-72
          bg-white/10 dark:bg-black/20 backdrop-blur-xl
          rounded-2xl border border-white/10
          overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-white/70" />
            <h3 className="text-sm font-medium text-white/90">
              {t('todo.title')}
            </h3>
          </div>
        </div>

        {/* Empty state */}
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-400/70" />
          </div>
          <p className="text-sm text-white/50">
            {t('todo.allCompleted')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        fixed right-4 top-1/2 -translate-y-1/2 z-30
        w-72 max-h-[60vh]
        bg-white/10 dark:bg-black/20 backdrop-blur-xl
        rounded-2xl border border-white/10
        overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-white/70" />
            <h3 className="text-sm font-medium text-white/90">
              {t('todo.title')}
            </h3>
          </div>
          <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
            {incompleteTodos.length}
          </span>
        </div>
      </div>

      {/* Todo list */}
      <div className="overflow-y-auto max-h-[calc(60vh-52px)]">
        <div className="p-2 space-y-1">
          {incompleteTodos.map((todo: TodoItem) => (
            <HomeTodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => {
                void toggleTodo(todo.id).catch((error) => {
                  console.error('[HomeTodoList] Failed to toggle todo:', error);
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Individual todo item component
interface HomeTodoItemProps {
  todo: TodoItem;
  onToggle: () => void;
}

const HomeTodoItem: React.FC<HomeTodoItemProps> = ({ todo, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="
        w-full flex items-start gap-3 p-2.5 rounded-xl
        hover:bg-white/10 transition-colors
        text-left group
      "
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 mt-0.5">
        <Circle className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 leading-tight break-words">
          {todo.text}
        </p>
        {todo.dueDate && (
          <p className="text-xs text-white/40 mt-1">
            {formatDate(todo.dueDate)}
          </p>
        )}
      </div>
    </button>
  );
};

export default HomeTodoList;
