/**
 * NotesSidebar Component
 *
 * Notes management sidebar with search and pinning support.
 */

import { useState, useMemo } from 'react';
import { FileText, Search, Pin, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotes } from '../../hooks';
import { cn } from '../../utils';

export function NotesSidebar() {
  const { t } = useTranslation();
  const { notes, addNote, deleteNote, updateNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note =>
        note.content.toLowerCase().includes(query) ||
        (note.title && note.title.toLowerCase().includes(query))
      );
    }

    // Sort: pinned first, then by update time
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

    return result;
  }, [notes, searchQuery]);

  // Get selected note
  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find(n => n.id === selectedNoteId);
  }, [notes, selectedNoteId]);

  // Handle create new note
  const handleCreateNote = async () => {
    try {
      const newNote = await addNote(t('notes.newNote'));
      if (newNote) {
        setSelectedNoteId(newNote.id);
        setEditingContent(newNote.content);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // Handle toggle pin
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await updateNote(id, { isPinned: !currentPinned });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
        setEditingContent('');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (selectedNoteId) {
      try {
        await updateNote(selectedNoteId, { content: editingContent });
      } catch (error) {
        console.error('Failed to save note:', error);
      }
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('history.today');
    if (diffDays === 1) return t('history.yesterday');
    if (diffDays < 7) return t('notes.daysAgo', { days: diffDays });
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get note preview (first line or truncated content)
  const getNotePreview = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Add */}
      <div className="p-4 space-y-3 border-b dark:border-gray-700">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('notes.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCreateNote}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Notes List */}
        <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('notes.noNotes')}</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setEditingContent(note.content);
                }}
                className={cn(
                  'w-full p-3 text-left border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                  selectedNoteId === note.id && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {note.isPinned && <Pin className="w-3 h-3 text-blue-500" />}
                  <span className="text-xs text-gray-400">
                    {formatDate(note.updatedAt || note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {getNotePreview(note.content) || t('notes.emptyNote')}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Note Editor */}
        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              {/* Editor Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
                <span className="text-xs text-gray-400">
                  {formatDate(selectedNote.updatedAt || selectedNote.createdAt)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleTogglePin(selectedNote.id, selectedNote.isPinned || false)}
                    className={cn(
                      'p-2 rounded transition-colors',
                      selectedNote.isPinned
                        ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    )}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                onBlur={handleSave}
                className="flex-1 p-4 resize-none bg-transparent focus:outline-none text-gray-900 dark:text-gray-100"
                placeholder={t('notes.contentPlaceholder')}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('notes.selectToView')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesSidebar;
