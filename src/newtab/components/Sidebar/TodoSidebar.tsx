import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Trash2,
  Check,
  ChevronDown,
  CornerDownLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTodos, type TodoPriority } from '../../hooks';
import { useFlipAnimation } from '../../hooks/useFlipAnimation';
import { cn } from '../../utils';
import type { TodoItem } from '../../services/database';

type Priority = TodoPriority;

// Priority options with i18n keys
const PRIORITY_OPTIONS: { value: Priority; labelKey: string; color: string }[] = [
  { value: 'high', labelKey: 'todo.priority.high', color: 'bg-red-500' },
  { value: 'medium', labelKey: 'todo.priority.medium', color: 'bg-yellow-500' },
  { value: 'low', labelKey: 'todo.priority.low', color: 'bg-green-500' },
  { value: 'none', labelKey: 'todo.priority.none', color: 'bg-gray-400' },
];

/**
 * Generate consistent HSL color from string hash
 */
function hashToHSL(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
}

/**
 * Render text with highlighted tags
 */
function renderTextWithTags(text: string): React.ReactNode {
  const parts = text.split(/(#[\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff-]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      const color = hashToHSL(part);
      return (
        <span
          key={index}
          className="font-medium hover:underline"
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
  const { t } = useTranslation();
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted } = useTodos({ includeCompleted: true });

  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>('medium');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPriority, setEditingPriority] = useState<Priority>('medium');
  const editInputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  // Animation state for smooth exit
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // Confirmation state for clearing completed
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    if (confirmingClear) {
      const timer = setTimeout(() => setConfirmingClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingClear]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Split and sort todos
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

    const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };

    // Sort active: Priority -> Updated time
    active.sort((a, b) => {
      const pDiff = priorityOrder[a.priority || 'none'] - priorityOrder[b.priority || 'none'];
      if (pDiff !== 0) return pDiff;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

    // Sort completed: Updated time
    completed.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

    return { activeTodos: active, completedTodos: completed };
  }, [todos]);

  // Use custom FLIP animation hook for active list
  const activeListRef = useFlipAnimation<HTMLDivElement>(activeTodos);

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

  const handleToggle = useCallback(async (id: string) => {
    // Add to exiting state to trigger animation
    setExitingIds(prev => new Set(prev).add(id));

    // Wait for animation to finish before actual toggle
    setTimeout(async () => {
      await toggleTodo(id);
      // Remove from exiting state after toggle is complete (and item has moved)
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400); // 400ms match CSS animation duration
  }, [toggleTodo]);

  const startEditing = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
    setEditingPriority(todo.priority || 'medium');
  };

  const saveEditing = async () => {
    if (editingId && editingText.trim()) {
      await updateTodo(editingId, {
        text: editingText.trim(),
        priority: editingPriority
      });
      setEditingId(null);
      setEditingText('');
    } else {
      setEditingId(null); // Cancel if empty
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is still within the edit container
    if (editContainerRef.current && editContainerRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    saveEditing();
  };

  // Custom Checkbox Component with animation
  const AnimatedCheckbox = ({ done, priority, onClick }: { done: boolean; priority?: Priority; onClick: () => void }) => {
    // Priority colors for the border ring
    const priorityColors = {
      high: 'border-red-500 hover:border-red-600',
      medium: 'border-yellow-500 hover:border-yellow-600',
      low: 'border-green-500 hover:border-green-600',
      none: 'border-gray-300 dark:border-gray-600 hover:border-gray-400',
    };

    const borderColor = priorityColors[priority as keyof typeof priorityColors] || priorityColors.none;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "relative group/checkbox mt-1 flex-none w-5 h-5 rounded-full border-2 transition-all duration-300 ease-out",
          done
            ? "bg-zinc-500 border-zinc-500 scale-95"
            : `bg-transparent ${borderColor} hover:bg-gray-50 dark:hover:bg-zinc-800`
        )}
      >
        <div className={cn(
          "absolute inset-0 flex items-center justify-center text-white pointer-events-none"
        )}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "transition-all duration-300 ease-out",
              done ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          >
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "origin-center transition-all duration-500",
                done ? "animate-[draw-check_0.4s_ease-out_forwards]" : "stroke-dasharray-0"
              )}
              style={{
                strokeDasharray: 12,
                strokeDashoffset: done ? 0 : 12
              }}
            />
          </svg>
        </div>
      </button>
    );
  };

  const PriorityBadge = ({ priority }: { priority?: Priority }) => {
    if (!priority || priority === 'none') {
      // Small dot for no priority/default to keep alignment if needed, or just null
      return null;
    }

    // Only show badge for High/Medium/Low? Or just High?
    // User requested "urgent degree identification". Let's show all except none.
    const option = PRIORITY_OPTIONS.find(o => o.value === priority);
    if (!option) return null;

    return (
      <span className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ml-2 shadow-sm text-white shrink-0",
        option.color
      )}>
        {t(option.labelKey)}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
      {/* We need global styles for the draw animation since we can't easily add keyframes in Tailwind inline */}
      <style>{`
          @keyframes draw-check {
            0% { stroke-dashoffset: 12; }
            100% { stroke-dashoffset: 0; }
          }
        `}</style>
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-6">
        {/* Input Area */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-800/40 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl p-1 shadow-sm focus-within:border-zinc-800 dark:focus-within:border-zinc-400 focus-within:shadow-md transition-all duration-300">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder={t('todo.addPlaceholder', 'Add new todo... Use #tag for categories (Enter to add)')}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-sm bg-transparent',
                'text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none'
              )}
            />
          </div>

          <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex p-1 gap-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg">
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = newTodoPriority === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setNewTodoPriority(option.value)}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
                      isSelected
                        ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm scale-105'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
                    )}
                  >
                    {t(option.labelKey)}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleAddTodo}
              disabled={!newTodoText.trim()}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                newTodoText.trim()
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md hover:scale-105 active:scale-95"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed opacity-50"
              )}
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active List */}
        <div
          ref={activeListRef}
          className="space-y-2 relative"
        >
          {activeTodos.map((todo) => {
            const isEditing = editingId === todo.id;
            const isExiting = exitingIds.has(todo.id);
            return (
              <div
                key={todo.id}
                data-flip-id={todo.id}
                onClick={() => !isEditing && !isExiting && startEditing(todo)}
                {...(isEditing ? { ref: editContainerRef, onBlur: handleBlur, tabIndex: -1 } : {})}
                className={cn(
                  "group flex items-start gap-3 p-3 bg-white dark:bg-zinc-800/20 border border-transparent rounded-xl transition-all duration-400 ease-in-out",
                  isExiting
                    ? "translate-y-12 opacity-0 h-0 py-0 my-0 overflow-hidden"
                    : "animate-in slide-in-from-bottom-2 fade-in",
                  isEditing
                    ? "ring-2 ring-zinc-500/20 dark:ring-zinc-400/20 shadow-lg scale-[1.02] bg-white dark:bg-zinc-800 pb-2"
                    : "hover:border-gray-200 dark:hover:border-zinc-700 cursor-pointer"
                )}
              >
                {!isEditing && (
                  <AnimatedCheckbox
                    done={todo.done}
                    priority={todo.priority}
                    onClick={() => handleToggle(todo.id)}
                  />
                )}

                <div className="flex-1 min-w-0 pt-0.5 transition-all duration-300">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="w-full bg-transparent p-0 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 leading-relaxed font-medium"
                      />
                      <div className="flex gap-1 pt-1 border-t border-gray-100 dark:border-zinc-700/50">
                        {PRIORITY_OPTIONS.map((option) => {
                          const isLocalSelected = editingPriority === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPriority(option.value);
                              }}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-medium transition-all',
                                isLocalSelected
                                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                              )}
                            >
                              {t(option.labelKey)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed break-words font-medium block">
                      {renderTextWithTags(todo.text)}
                      <PriorityBadge priority={todo.priority} />
                    </span>
                  )}
                </div>

                {!isEditing && !isExiting && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTodo(todo.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 hover:scale-110 active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-500 ease-in-out",
              activeTodos.length === 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div
                className={cn(
                  "py-12 text-center transition-all duration-500",
                  activeTodos.length === 0 ? "opacity-100 delay-200" : "opacity-0"
                )}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-800/50 mb-3 group">
                  <Check className="w-6 h-6 text-gray-300 dark:text-gray-600 transition-transform duration-500 group-hover:scale-110 group-hover:text-zinc-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {t('todo.empty', 'No todos yet')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Section with Accordion */}
        <div className="pt-2 duration-500 transition-all">
          <button
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors w-full group"
          >
            <div className={cn("transition-transform duration-300", isCompletedExpanded ? "rotate-0" : "-rotate-90")}>
              <ChevronDown className="w-4 h-4" />
            </div>
            {t('todo.completed', 'Completed')} ({completedTodos.length})
            <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800 ml-2 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 transition-colors" />
          </button>

          {isCompletedExpanded && (
            <div className="mt-3 space-y-1">
              {completedTodos.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-600 italic">
                  {t('todo.noCompleted', 'No completed items')}
                </div>
              )}
              {completedTodos.map((todo, index) => {
                const isExiting = exitingIds.has(todo.id);
                return (
                  <div
                    key={todo.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={cn(
                      "group flex items-center gap-3 p-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-all duration-400 ease-in-out",
                      isExiting
                        ? "-translate-y-4 opacity-0 h-0 py-0 my-0 overflow-hidden"
                        : "animate-in slide-in-from-top-4 fade-in"
                    )}
                  >
                    <AnimatedCheckbox
                      done={true}
                      priority={todo.priority}
                      onClick={() => handleToggle(todo.id)}
                    />
                    <span className="flex-1 text-sm text-gray-400 dark:text-gray-500 line-through truncate transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400">
                      {todo.text}
                    </span>
                    {!isExiting && (
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all hover:scale-110 active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {completedTodos.length > 0 && (
                <button
                  onClick={() => {
                    if (confirmingClear) {
                      clearCompleted();
                      setConfirmingClear(false);
                    } else {
                      setConfirmingClear(true);
                    }
                  }}
                  className={cn(
                    "mt-4 w-full py-2 text-xs rounded-lg transition-all border",
                    confirmingClear
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 border-red-300 dark:border-red-800 animate-pulse font-medium"
                      : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 border-dashed border-red-200 dark:border-red-900/30 hover:border-red-300"
                  )}
                >
                  {confirmingClear ? t('todo.confirmClear', 'Click again to confirm') : t('todo.clearCompleted', 'Clear all completed')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoSidebar;

