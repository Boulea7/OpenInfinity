import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useShallow } from 'zustand/shallow';
import { db } from '../services/database';
import { useSettingsStore } from '../stores';
import type { TodoItem } from '../services/database';

// Define TodoPriority type since it's not exported from database
type TodoPriority = 'high' | 'medium' | 'low';

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
 */
export function useTodos(): UseTodosReturn {
  // Only subscribe to the specific settings we need to avoid unnecessary re-renders
  const { maxItems, showCompleted } = useSettingsStore(
    useShallow((state) => ({
      maxItems: state.widgetSettings.todoWidget.maxItems,
      showCompleted: state.widgetSettings.todoWidget.showCompleted,
    }))
  );

  // Real-time query for todos
  const todos = useLiveQuery(() => {
    let query = db.todos.orderBy('createdAt').reverse();

    // Apply max items limit from settings
    if (maxItems > 0) {
      query = query.limit(maxItems);
    }

    // Filter completed todos if setting is disabled
    if (!showCompleted) {
      query = query.filter(todo => !todo.done);
    }

    return query.toArray();
  }, [maxItems, showCompleted]);

  // Add new todo
  const addTodo = useCallback(async (text: string, priority: TodoPriority = 'medium') => {
    if (!text.trim()) return;

    try {
      const newTodo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'> = {
        text: text.trim(),
        done: false,
        priority,
        children: [],
        tags: [],
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