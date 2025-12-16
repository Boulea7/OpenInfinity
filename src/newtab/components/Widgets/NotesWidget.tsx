import { useState, useCallback, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { useSettingsStore } from '../../stores';
import { useNotes } from '../../hooks';
import { cn } from '../../utils';
import type { BaseWidgetProps } from '../../types';

/**
 * Notes Widget component with Markdown support
 * Displays and manages notes with Markdown editing within the sidebar
 */
export function NotesWidget({ isExpanded, onToggleExpand, className }: BaseWidgetProps) {
  const { viewSettings } = useSettingsStore();
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Auto-select first note if none selected - must be before early return
  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Handle adding new note - must be defined before early return
  const handleAddNote = useCallback(async () => {
    try {
      await addNote('# New Note\n\nStart writing...');
      // Select the newly added note (last in list after re-render)
      setIsEditMode(true);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, [addNote]);

  // Handle delete note - must be defined before early return
  const handleDeleteNote = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('确定要删除这条笔记吗？')) {
      try {
        await deleteNote(id);
        if (selectedNoteId === id) {
          setSelectedNoteId(null);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  }, [deleteNote, selectedNoteId]);

  // Handle note content update - must be defined before early return
  const handleNoteChange = useCallback(async (value: string | undefined) => {
    if (!selectedNote) return;
    try {
      await updateNote(selectedNote.id, value || '');
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [selectedNote, updateNote]);

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
          <span className="font-medium text-white">笔记</span>
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
            title="新建笔记"
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
                <p>暂无笔记</p>
                <p className="text-xs mt-1">点击 + 创建</p>
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
                    title={isEditMode ? '切换到预览' : '切换到编辑'}
                  >
                    {isEditMode ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>预览</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3 h-3" />
                        <span>编辑</span>
                      </>
                    )}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={(e) => handleDeleteNote(selectedNote.id, e)}
                    className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    删除笔记
                  </button>
                </div>

                {/* Markdown Editor/Preview */}
                <div className="flex-1 overflow-auto" data-color-mode="dark">
                  {isEditMode ? (
                    <MDEditor
                      value={selectedNote.content}
                      onChange={handleNoteChange}
                      preview="edit"
                      height="100%"
                      hideToolbar={false}
                      visibleDragbar={false}
                      textareaProps={{
                        placeholder: 'Write your note in Markdown...',
                      }}
                    />
                  ) : (
                    <div className="p-4">
                      <MDEditor.Markdown
                        source={selectedNote.content}
                        style={{ backgroundColor: 'transparent', color: '#fff' }}
                      />
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
