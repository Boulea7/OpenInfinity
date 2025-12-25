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
  addNote: (content: string, tags?: string[]) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
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

  // Add new note - returns the new note for selection
  const addNote = useCallback(async (content: string, tags: string[] = []): Promise<Note | null> => {
    try {
      const id = crypto.randomUUID();
      const now = Date.now();
      const newNote: Note = {
        id,
        title: '',
        content: content.trim() || '',
        isPinned: false,
        tags: tags.filter(tag => tag.trim()),
        createdAt: now,
        updatedAt: now,
      };

      await db.notes.add(newNote);
      return newNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  }, []);

  // Update existing note - accepts partial updates
  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      const payload: Partial<Note> = {
        ...updates,
        updatedAt: Date.now(),
      };
      // Trim content if provided
      if (payload.content !== undefined) {
        payload.content = payload.content.trim();
      }
      // Filter tags if provided
      if (payload.tags !== undefined) {
        payload.tags = payload.tags.filter(tag => tag.trim());
      }
      await db.notes.update(id, payload);
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
            note.tags?.some(tag => tag.toLowerCase().includes(term))
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