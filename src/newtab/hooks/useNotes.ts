import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/database';
import { useSettingsStore } from '../stores';
import type { Note } from '../services/database';

/**
 * Hook for managing notes
 * Provides CRUD operations and real-time data synchronization
 */
export interface UseNotesReturn {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  addNote: (content: string, tags?: string[]) => Promise<void>;
  updateNote: (id: string, content: string, tags?: string[]) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<Note[]>;
}

/**
 * Notes data management hook
 * Uses Dexie's useLiveQuery for real-time database synchronization
 */
export function useNotes(): UseNotesReturn {
  const { widgetSettings } = useSettingsStore();

  // Real-time query for notes
  const notes = useLiveQuery(() => {
    let query = db.notes.orderBy('updatedAt').reverse();

    // Apply max items limit from settings
    if (widgetSettings.notesWidget.maxItems > 0) {
      query = query.limit(widgetSettings.notesWidget.maxItems);
    }

    return query.toArray();
  }, [widgetSettings.notesWidget]);

  // Add new note
  const addNote = useCallback(async (content: string, tags: string[] = []) => {
    if (!content.trim()) return;

    try {
      const newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
        content: content.trim(),
        tags: tags.filter(tag => tag.trim()), // Filter out empty tags
      };

      await db.notes.add({
        ...newNote,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  }, []);

  // Update existing note
  const updateNote = useCallback(async (id: string, content: string, tags?: string[]) => {
    if (!content.trim()) return;

    try {
      await db.notes.update(id, {
        content: content.trim(),
        tags: tags ? tags.filter(tag => tag.trim()) : undefined,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }, []);

  // Delete note
  const deleteNote = useCallback(async (id: string) => {
    try {
      await db.notes.delete(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }, []);

  // Search notes
  const searchNotes = useCallback(async (query: string) => {
    if (!query.trim()) return [];

    try {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);

      const notes = await db.notes
        .filter(note => {
          const content = note.content.toLowerCase();
          return searchTerms.every(term =>
            content.includes(term) ||
            note.tags.some(tag => tag.toLowerCase().includes(term))
          );
        })
        .toArray();

      return notes;
    } catch (error) {
      console.error('Failed to search notes:', error);
      throw error;
    }
  }, []);

  return {
    notes: notes || [],
    isLoading: notes === undefined,
    error: null, // Error handling can be enhanced as needed
    addNote,
    updateNote,
    deleteNote,
    searchNotes,
  };
}