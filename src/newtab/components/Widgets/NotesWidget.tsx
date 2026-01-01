import { useState, useCallback, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { FileText, Plus, Trash2, Edit2, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../stores';
import { useNotes } from '../../hooks';
import { cn } from '../../utils';
import type { BaseWidgetProps } from '../../types';

/**
 * Notes Widget component with Markdown support
 * Displays and manages notes with Markdown editing within the sidebar
 */
export function NotesWidget({ isExpanded, onToggleExpand, className }: BaseWidgetProps) {
  const { t } = useTranslation();
  const { viewSettings } = useSettingsStore(
    useShallow((state) => ({ viewSettings: state.viewSettings }))
  );
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftContent, setDraftContent] = useState('');

  // Auto-select first note if none selected - must be before early return
  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Sync draft content when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setDraftContent(selectedNote.content);
    } else {
      setDraftContent('');
    }
  }, [selectedNote]);

  // Handle adding new note - must be defined before early return
  const handleAddNote = useCallback(async () => {
    try {
      const newNote = await addNote('# New Note\n\nStart writing...');
      if (newNote) {
        setSelectedNoteId(newNote.id); // Auto-select the newly created note
        setIsEditMode(true);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, [addNote]);

  // Handle delete note - must be defined before early return
  const handleDeleteNote = useCallback(async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    if (confirm(t('notes.deleteNote', '确定要删除这条笔记吗？') + '?')) {
      try {
        await deleteNote(id);
        // Auto-select next note after deletion
        if (selectedNoteId === id) {
          const nextNote = notes.find((n) => n.id !== id);
          setSelectedNoteId(nextNote?.id ?? null);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  }, [deleteNote, selectedNoteId, notes, t]);

  // Handle note content update - must be defined before early return
  const handleNoteChange = useCallback(async (value: string | undefined) => {
    if (!selectedNote) return;
    const next = value ?? '';
    setDraftContent(next); // Keep UI responsive
    try {
      await updateNote(selectedNote.id, { content: next });
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [selectedNote?.id, updateNote]);

  // Don't render if widget is disabled
  if (!viewSettings.showNotesWidget) return null;

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // Extract title from content (first line)
  const getTitle = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.replace(/^#+\s*/, '').trim() || 'Untitled';
  };

  return (
    <div className={cn('bg-white/5 rounded-lg overflow-hidden border border-white/10 flex flex-col', className)}>
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-white/80" />
          <span className="font-medium text-white">{t('notes.title', '笔记')}</span>
          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
            {notes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddNote();
            }}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={t('notes.newNote', '新建笔记')}
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
        <div className="flex-1 flex overflow-hidden" style={{ height: '500px' }}>
          {/* Notes List */}
          <div className="w-48 border-r border-white/10 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="p-4 text-center text-white/40 text-sm">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('notes.noNotes', '暂无笔记')}</p>
                <p className="text-xs mt-1">{t('notes.noNotesDescription', '点击 + 创建')}</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setIsEditMode(false);
                  }}
                  className={cn(
                    'p-3 border-b border-white/5 cursor-pointer transition-colors group',
                    selectedNoteId === note.id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {getTitle(note.content)}
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        {formatDate(note.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Editor/Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedNote ? (
              <>
                {/* Toolbar */}
                <div className="p-2 border-b border-white/10 flex items-center gap-2 bg-white/5">
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5',
                      isEditMode
                        ? 'bg-white/10 text-white'
                        : 'bg-transparent text-white/60 hover:bg-white/5'
                    )}
                    title={isEditMode ? t('notes.viewMode.preview', '切换到预览') : t('notes.viewMode.edit', '切换到编辑')}
                  >
                    {isEditMode ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>{t('notes.viewMode.preview', '预览')}</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3 h-3" />
                        <span>{t('notes.viewMode.edit', '编辑')}</span>
                      </>
                    )}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={(e) => handleDeleteNote(selectedNote.id, e)}
                    className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    {t('notes.delete', '删除笔记')}
                  </button>
                </div>

                {/* Content Editor or Preview */}
                <div className="flex-1 overflow-auto">
                  {isEditMode ? (
                    <textarea
                      value={draftContent}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      placeholder={t('notes.contentPlaceholder', 'Write your note...')}
                      className="w-full h-full p-4 bg-transparent border-none outline-none resize-none text-white/80 placeholder-white/30 text-sm"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap p-4 text-white/80 text-sm leading-relaxed min-h-full">
                      {draftContent || t('notes.emptyNote', '（空笔记）')}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/40">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>选择或创建笔记</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesWidget;
