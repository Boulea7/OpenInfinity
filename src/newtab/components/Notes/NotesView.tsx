import { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Pin, StickyNote, Trash2, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { markdownLivePreview } from '../../extensions/markdownLivePreview';
import { db, Note, generateId } from '../../services/database';
import { useSearchStore } from '../../stores/searchStore';
import { cn, formatDate } from '../../utils';
import { htmlToPlainText } from '../../utils/htmlUtils';
import { isHtmlContent, htmlToMarkdown } from '../../utils/htmlToMarkdown';

interface NotesViewProps {
  className?: string;
  /** @deprecated Use searchStore instead */
  searchQuery?: string;
}

/**
 * NotesView Component
 * Redesigned as a Split-Pane Dashboard
 * Layout matches user request: "Same search bar position", "Split view below"
 */
export function NotesView({ className, searchQuery: propSearchQuery }: NotesViewProps) {
  const { t } = useTranslation();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Subscribe to search query from store (avoids App re-renders)
  const storeSearchQuery = useSearchStore((s) => s.query);
  // Support both store and prop (prop for backwards compatibility)
  const searchQuery = storeSearchQuery || propSearchQuery || '';

  // Load notes from database
  const allNotes = useLiveQuery(
    () => db.notes.orderBy('updatedAt').reverse().toArray(),
    []
  );

  // Filter notes - use useMemo to prevent unnecessary recalculations
  const filteredNotes = useMemo(() => {
    if (!allNotes) return [];
    if (!searchQuery) return allNotes;
    const q = searchQuery.toLowerCase();
    return allNotes.filter((note) =>
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q)
    );
  }, [allNotes, searchQuery]);

  const selectedNote = allNotes?.find(n => n.id === selectedNoteId);

  // Cache preview text for all notes (performance optimization)
  const notesWithPreview = useMemo(() => {
    return filteredNotes?.map(note => ({
      ...note,
      previewText: htmlToPlainText(note.content)
    }));
  }, [filteredNotes]);

  // Auto-select first note if none selected
  useEffect(() => {
    if (!selectedNoteId && filteredNotes && filteredNotes.length > 0) {
      setSelectedNoteId(filteredNotes[0].id);
    }
  }, [selectedNoteId, filteredNotes]);

  // Update local edit state when selection changes
  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      // Migrate HTML to Markdown if needed
      if (isHtmlContent(selectedNote.content)) {
        setEditContent(htmlToMarkdown(selectedNote.content));
      } else {
        setEditContent(selectedNote.content);
      }
    } else {
      setEditTitle('');
      setEditContent('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId]); // Intentionally omit selectedNote to prevent DB sync from resetting edit state

  const handleCreateNote = useCallback(async () => {
    const id = generateId();
    await db.notes.add({
      id,
      title: '',
      content: '',
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Note);
    setSelectedNoteId(id);
  }, []);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Note>) => {
    await db.notes.update(id, { ...updates, updatedAt: Date.now() });
  }, []);

  // Auto-save content with debounce (faster for real-time feel)
  useEffect(() => {
    if (!selectedNoteId) return;

    const timer = setTimeout(() => {
      handleUpdate(selectedNoteId, {
        title: editTitle,
        content: editContent
      }).catch((err) => console.error('[NotesView] Auto-save failed', err));
    }, 300); // 300ms debounce for real-time sync

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTitle, editContent, selectedNoteId]); // Intentionally omit selectedNote and handleUpdate to prevent unnecessary re-saves

  const handleDelete = useCallback(async (id: string) => {
    if (confirm(t('notes.deleteNote') + '?')) {
      await db.notes.delete(id);
      if (selectedNoteId === id) setSelectedNoteId(null);
    }
  }, [selectedNoteId, t]);

  const handleTogglePin = useCallback(async (note: Note) => {
    await handleUpdate(note.id, { isPinned: !note.isPinned });
  }, [handleUpdate]);

  return (
    <div className={cn('flex flex-row w-full h-full gap-6 animate-in fade-in duration-500', className)}>
      {/* LEFT PANEL: Note List */}
      <div className="w-1/3 min-w-[300px] flex flex-col gap-4">
        {/* Header Action Row (Create) */}
        <div className="flex items-center justify-between px-2">
          <div className="text-white/60 text-sm font-medium">
            {t('notes.count', { count: filteredNotes?.length || 0, defaultValue: '{{count}} Notes' })}
          </div>
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-orange/90 hover:bg-brand-orange text-white text-sm font-medium rounded-lg transition-all shadow-lg hover:shadow-brand-orange/20 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            {t('notes.newNote')}
          </button>
        </div>

        {/* List Container */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-3">
          {notesWithPreview?.map(note => (
            <div
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={cn(
                'group relative p-4 rounded-2xl border transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer',
                selectedNoteId === note.id
                  ? 'bg-white/20 dark:bg-white/10 border-white/20 shadow-lg backdrop-blur-md'
                  : 'bg-white/5 dark:bg-black/20 border-transparent hover:bg-white/10 hover:border-white/10'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={cn("font-bold truncate pr-4 text-base", !note.title && "italic text-white/40")}>
                  {note.title || t('notes.untitled')}
                </h3>
                {note.isPinned && <Pin className="w-3.5 h-3.5 text-brand-orange shrink-0 mt-1" />}
              </div>

              <p className="text-sm text-white/50 line-clamp-2 h-10 leading-relaxed font-normal">
                {note.previewText}
              </p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(note.updatedAt)}
                </span>
              </div>
            </div>
          ))}

          {notesWithPreview?.length === 0 && (
            <div className="text-center py-10 text-white/30">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('notes.noNotes')}</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Editor */}
      <div className="flex-1 relative rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl flex flex-col bg-white/5 backdrop-blur-xl">
        {selectedNote ? (
          <>
            {/* Editor Toolbar */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-white/5">
              {/* Title Input */}
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t('notes.titlePlaceholder')}
                className="bg-transparent text-xl font-bold text-white placeholder-white/30 outline-none w-full mr-4"
              />

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePin(selectedNote)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    selectedNote.isPinned ? "text-brand-orange bg-brand-orange/10" : "text-white/40 hover:bg-white/10 hover:text-white"
                  )}
                  title={selectedNote.isPinned ? t('notes.unpin') : t('notes.pin')}
                >
                  <Pin className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title={t('notes.delete')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative isolate">
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent h-32 opacity-20" />

              {/* CodeMirror Editor */}
              <div className="h-full">
                <CodeMirror
                  value={editContent}
                  onChange={(value) => setEditContent(value)}
                  extensions={[markdown(), markdownLivePreview, EditorView.lineWrapping]}
                  theme="dark"
                  height="100%"
                  basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                    highlightActiveLine: false,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <StickyNote className="w-10 h-10" />
            </div>
            <p className="font-medium text-lg">{t('notes.selectToView', 'Select a note to view')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
