import { useState, useCallback, useRef } from 'react';
import { FileText, Plus, Trash2, Edit2, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { useNotes } from '../../hooks';
import { cn } from '../../utils';
import type { BaseWidgetProps } from '../../types';

/**
 * Notes Widget component
 * Displays and manages notes within the sidebar
 */
export function NotesWidget({ isExpanded, onToggleExpand, className }: BaseWidgetProps) {
  const { viewSettings, widgetSettings } = useSettingsStore();
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Don't render if widget is disabled
  if (!viewSettings.showNotesWidget) return null;

  // Handle adding new note
  const handleAddNote = useCallback(async () => {
    if (newNoteContent.trim()) {
      try {
        await addNote(newNoteContent.trim());
        setNewNoteContent('');
        setShowAddModal(false);
      } catch (error) {
        console.error('Failed to add note:', error);
      }
    }
  }, [newNoteContent, addNote]);

  // Handle delete note
  const handleDeleteNote = useCallback(async (id: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      try {
        await deleteNote(id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  }, [deleteNote]);

  // Handle start editing
  const handleStartEditing = useCallback((id: string, content: string) => {
    setEditingId(id);
    setEditingContent(content);
    // Focus on next frame to ensure textarea is rendered
    requestAnimationFrame(() => {
      const textarea = document.querySelector(`#edit-note-${id}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        // Move cursor to end
        textarea.setSelectionRange(content.length, content.length);
      }
    });
  }, []);

  // Handle save editing
  const handleSaveEditing = useCallback(async (id: string) => {
    if (editingContent.trim()) {
      try {
        await updateNote(id, editingContent.trim());
        setEditingId(null);
        setEditingContent('');
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    } else {
      setEditingId(null);
      setEditingContent('');
    }
  }, [editingContent, updateNote]);

  // Handle cancel editing
  const handleCancelEditing = useCallback(() => {
    setEditingId(null);
    setEditingContent('');
  }, []);

  // Handle key events for add modal
  const handleAddKeydown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAddNote();
    } else if (e.key === 'Escape') {
      setShowAddModal(false);
      setNewNoteContent('');
    }
  }, [handleAddNote]);

  // Handle key events for editing
  const handleEditKeydown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSaveEditing(id);
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  }, [handleSaveEditing, handleCancelEditing]);

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
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
              setShowAddModal(true);
            }}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="添加笔记"
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
          {/* Add Note Modal */}
          {showAddModal && (
            <div className="mb-3 p-3 bg-white/5 rounded-lg">
              <textarea
                ref={textareaRef}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                onKeyDown={handleAddKeydown}
                placeholder="添加新笔记..."
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-white/40">
                  {newNoteContent.length} 字符
                  <span className="ml-2 text-white/20">Ctrl+Enter 保存</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim()}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewNoteContent('');
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-2">
            {notes.length === 0 ? (
              <div className="text-center py-6 text-white/40">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无笔记</p>
                <p className="text-xs mt-1">点击上方 + 按钮添加</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  {editingId === note.id ? (
                    <textarea
                      id={`edit-note-${note.id}`}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => handleEditKeydown(e, note.id)}
                      onBlur={() => handleSaveEditing(note.id)}
                      rows={3}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-white/40 resize-none"
                    />
                  ) : (
                    <div>
                      <div
                        onClick={() => handleStartEditing(note.id, note.content)}
                        className="text-white text-sm cursor-pointer hover:text-white/80 whitespace-pre-wrap break-words"
                      >
                        {note.content}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">
                        {widgetSettings.notesWidget.showTimestamp && formatDate(note.updatedAt)}
                      </span>
                      {note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/60"
                            >
                              <Hash className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="text-xs text-white/40">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId !== note.id && (
                        <button
                          onClick={() => handleStartEditing(note.id, note.content)}
                          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}