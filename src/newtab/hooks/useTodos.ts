import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useShallow } from 'zustand/shallow';
import { db } from '../services/database';
import { useSettingsStore } from '../stores';
import type { TodoItem } from '../services/database';

// Priority levels: high/medium/low/none (none = no priority set)
export type TodoPriority = 'high' | 'medium' | 'low' | 'none';

// Options for useTodos hook
export interface UseTodosOptions {
  // Force include completed items regardless of widget settings (for Sidebar)
  includeCompleted?: boolean;
}

/**
 * Hook for managing todo items
 * Provides CRUD operations and real-time data synchronization
 */
export interface UseTodosReturn {
  todos: TodoItem[];
  isLoading: boolean;
  error: string | null;
  addTodo: (text: string, priority?: TodoPriority) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

/**
 * Todo data management hook
 * Uses Dexie's useLiveQuery for real-time database synchronization
 *
 * @param options.includeCompleted - Force include completed items (for Sidebar use)
 */
export function useTodos(options?: UseTodosOptions): UseTodosReturn {
  // Only subscribe to the specific settings we need to avoid unnecessary re-renders
  const { maxItems, settingShowCompleted } = useSettingsStore(
    useShallow((state) => ({
      maxItems: state.widgetSettings.todoWidget.maxItems,
      settingShowCompleted: state.widgetSettings.todoWidget.showCompleted,
    }))
  );

  // Sidebar requires completed items regardless of widget settings
  const showCompleted = options?.includeCompleted ?? settingShowCompleted;

  // Real-time query for todos
  const todos = useLiveQuery(() => {
    let query = db.todos.orderBy('createdAt').reverse();

    // Apply max items limit only for widget (not for sidebar with includeCompleted)
    if (maxItems > 0 && !options?.includeCompleted) {
      query = query.limit(maxItems);
    }

    // Filter completed todos if setting is disabled
    if (!showCompleted) {
      query = query.filter(todo => !todo.done);
    }

    return query.toArray();
  }, [maxItems, showCompleted, options?.includeCompleted]);

  // Add new todo with automatic tag extraction
  const addTodo = useCallback(async (text: string, priority: TodoPriority = 'none') => {
    if (!text.trim()) return;

    try {
      // Extract #tags from text (supports Unicode word characters for CJK)
      const tagMatches = text.match(/#[\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff-]+/g) || [];
      const tags = tagMatches.map(t => t.substring(1)); // Remove # prefix

      const newTodo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'> = {
        text: text.trim(),
        done: false,
        priority,
        children: [],
        tags,
      };

      await db.todos.add({
        ...newTodo,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to add todo:', error);
      throw error;
    }
  }, []);

  // Toggle todo completion status
  const toggleTodo = useCallback(async (id: string) => {
    try {
      const todo = await db.todos.get(id);
      if (!todo) throw new Error('Todo not found');

      await db.todos.update(id, {
        done: !todo.done,
        completedAt: !todo.done ? Date.now() : undefined,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      throw error;
    }
  }, []);

  // Delete todo
  const deleteTodo = useCallback(async (id: string) => {
    try {
      await db.todos.delete(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  }, []);

  // Update todo
  const updateTodo = useCallback(async (id: string, updates: Partial<TodoItem>) => {
    try {
      await db.todos.update(id, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  }, []);

  // Clear completed todos using batch delete for better performance
  const clearCompleted = useCallback(async () => {
    try {
      // Get IDs of completed todos and delete in batch
      const completedIds = await db.todos
        .filter(todo => todo.done)
        .primaryKeys();

      if (completedIds.length > 0) {
        await db.todos.bulkDelete(completedIds);
      }
    } catch (error) {
      console.error('Failed to clear completed todos:', error);
      throw error;
    }
  }, []);

  return {
    todos: todos || [],
    isLoading: todos === undefined,
    error: null, // Error handling can be enhanced as needed
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    clearCompleted,
  };
}