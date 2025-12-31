import { useState, useCallback, useRef } from 'react';
import { CheckSquare, Square, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores';
import { useTodos } from '../../hooks';
import { cn, formatDate } from '../../utils';
import type { BaseWidgetProps } from '../../types';
import { normalizeUiLanguage } from '../../../shared/locale';
import { tr } from '../../../shared/tr';

/**
 * Todo Widget component
 * Displays and manages todo items within the sidebar
 */
export function TodoWidget({ isExpanded, onToggleExpand, className }: BaseWidgetProps) {
  const { i18n } = useTranslation();
  const lang = normalizeUiLanguage(i18n.language);
  const { viewSettings } = useSettingsStore();
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted } = useTodos();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle adding new todo - must be defined before early return
  const handleAddTodo = useCallback(async () => {
    if (newTodoText.trim()) {
      try {
        await addTodo(newTodoText.trim());
        setNewTodoText('');
        setShowAddModal(false);
      } catch (error) {
        console.error('Failed to add todo:', error);
      }
    }
  }, [newTodoText, addTodo]);

  // Handle toggle todo completion - must be defined before early return
  const handleToggleTodo = useCallback(async (id: string) => {
    try {
      await toggleTodo(id);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  }, [toggleTodo]);

  // Handle delete todo - must be defined before early return
  const handleDeleteTodo = useCallback(async (id: string) => {
    if (confirm(tr('确定要删除这个待办事项吗？', 'Are you sure you want to delete this todo?', lang))) {
      try {
        await deleteTodo(id);
      } catch (error) {
        console.error('Failed to delete todo:', error);
      }
    }
  }, [deleteTodo, lang]);

  // Handle start editing - must be defined before early return
  const handleStartEditing = useCallback((id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
    // Focus on next frame to ensure input is rendered
    requestAnimationFrame(() => {
      const input = document.querySelector(`#edit-todo-${id}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }, []);

  // Handle save editing - must be defined before early return
  const handleSaveEditing = useCallback(async (id: string) => {
    if (editingText.trim()) {
      try {
        await updateTodo(id, { text: editingText.trim() });
        setEditingId(null);
        setEditingText('');
      } catch (error) {
        console.error('Failed to update todo:', error);
      }
    } else {
      setEditingId(null);
      setEditingText('');
    }
  }, [editingText, updateTodo]);

  // Handle cancel editing - must be defined before early return
  const handleCancelEditing = useCallback(() => {
    setEditingId(null);
    setEditingText('');
  }, []);

  // Handle key events - must be defined before early return
  const handleAddKeydown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTodo();
    } else if (e.key === 'Escape') {
      setShowAddModal(false);
      setNewTodoText('');
    }
  }, [handleAddTodo]);

  const handleEditKeydown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEditing(id);
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  }, [handleSaveEditing, handleCancelEditing]);

  // Don't render if widget is disabled
  if (!viewSettings.showTodoWidget) return null;

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className={cn('bg-white/5 rounded-lg overflow-hidden border border-white/10', className)}>
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-white/80" />
          <span className="font-medium text-white">{tr('待办事项', 'Todo', lang)}</span>
          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
            {todos.filter(t => !t.done).length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddModal(true);
            }}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={tr('添加待办', 'Add todo', lang)}
          >
            <Plus className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/60" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* Add Todo Modal */}
          {showAddModal && (
            <div className="mb-3 p-3 bg-white/5 rounded-lg">
              <input
                ref={inputRef}
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={handleAddKeydown}
                placeholder={tr('添加新待办事项...', 'Add a new todo...', lang)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddTodo}
                  disabled={!newTodoText.trim()}
                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                >
                  {tr('添加', 'Add', lang)}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewTodoText('');
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                >
                  {tr('取消', 'Cancel', lang)}
                </button>
              </div>
            </div>
          )}

          {/* Todo List */}
          <div className="space-y-1">
            {todos.length === 0 ? (
              <div className="text-center py-6 text-white/40">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{tr('暂无待办事项', 'No todos yet', lang)}</p>
                <p className="text-xs mt-1">{tr('点击上方 + 按钮添加', 'Click + above to add one', lang)}</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group',
                    todo.done && 'opacity-60'
                  )}
                >
                  <button
                    onClick={() => handleToggleTodo(todo.id)}
                    className="mt-1 text-white/60 hover:text-white transition-colors"
                  >
                    {todo.done ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      <input
                        id={`edit-todo-${todo.id}`}
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => handleEditKeydown(e, todo.id)}
                        onBlur={() => handleSaveEditing(todo.id)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-white/40"
                      />
                    ) : (
                      <div
                        onClick={() => handleStartEditing(todo.id, todo.text)}
                        className={cn(
                          'text-white text-sm cursor-pointer hover:text-white/80',
                          todo.done && 'line-through'
                        )}
                      >
                        {todo.text}
                      </div>
                    )}

                    {/* Metadata */}
                    {todo.dueDate && (
                      <div className="text-xs text-white/40 mt-1">
                        {tr('截止', 'Due', lang)}: {formatDate(todo.dueDate)}
                      </div>
                    )}
                  </div>

                  {/* Priority indicator */}
                  {todo.priority && todo.priority !== 'medium' && (
                    <div className={cn('text-xs', getPriorityColor(todo.priority))}>
                      {todo.priority === 'high'
                        ? tr('高', 'High', lang)
                        : tr('低', 'Low', lang)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!todo.done && (
                      <button
                        onClick={() => handleStartEditing(todo.id, todo.text)}
                        className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title={tr('编辑', 'Edit', lang)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title={tr('删除', 'Delete', lang)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clear completed button */}
          {todos.some(t => t.done) && (
            <button
              onClick={clearCompleted}
              className="w-full mt-3 p-2 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {tr('清除已完成', 'Clear completed', lang)} ({todos.filter(t => t.done).length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
