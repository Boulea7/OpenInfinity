import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Save, Pin, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { markdownLivePreview } from '../../extensions/markdownLivePreview';
import { Note } from '../../services/database';
import { isHtmlContent, htmlToMarkdown } from '../../utils/htmlToMarkdown';
import { cn } from '../../utils';

interface NoteEditorProps {
  note?: Note | null;
  onSave: (note: Partial<Note>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
  className?: string;
}

/**
 * NoteEditor Component
 * Obsidian-style live preview editor using CodeMirror 6
 * Shows rendered Markdown, reveals syntax on cursor line
 */
export function NoteEditor({ note, onSave, onDelete, onClose, className }: NoteEditorProps) {
  const { t } = useTranslation();

  // Store normalized initial content to avoid false "unsaved" detection after HTML→MD migration
  const normalizedInitialContent = useRef<string>('');

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(() => {
    // Migrate HTML to Markdown if needed
    const normalized = note?.content && isHtmlContent(note.content)
      ? htmlToMarkdown(note.content)
      : note?.content || '';
    normalizedInitialContent.current = normalized;
    return normalized;
  });
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track unsaved changes (compare against normalized initial content)
  const hasUnsavedChanges = title !== (note?.title || '') || content !== normalizedInitialContent.current;

  // Define handlers
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      alert(t('notes.titlePlaceholder'));
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...(note?.id && { id: note.id }),
        title: title.trim(),
        content: content, // Store as Markdown
        isPinned,
        updatedAt: Date.now(),
        ...(!note?.id && { createdAt: Date.now() }),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [title, content, isPinned, note, onSave, onClose, t]);

  const handleDelete = useCallback(async () => {
    if (!note?.id) return;
    if (!confirm(t('notes.deleteNote') + '?')) return;

    try {
      await onDelete?.(note.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('删除失败，请重试');
    }
  }, [note, onDelete, onClose, t]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        if (hasUnsavedChanges) {
          if (confirm(t('notes.unsavedChangesConfirm', 'You have unsaved changes. Are you sure you want to close?'))) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onClose, hasUnsavedChanges, t]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm view-transition-fade-in animate-in fade-in zoom-in-95 duration-200',
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (hasUnsavedChanges) {
            if (confirm(t('notes.unsavedChangesConfirm', 'You have unsaved changes. Are you sure you want to close?'))) {
              onClose();
            }
          } else {
            onClose();
          }
        }
      }}
    >
      <div
        className={cn(
          'glass flex flex-col transition-all duration-300 ease-in-out shadow-2xl overflow-hidden',
          isFullscreen ? 'w-full h-full rounded-none' : 'w-[90vw] h-[90vh] rounded-2xl'
        )}
      >
        {/* Top Toolbar */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('notes.titlePlaceholder')}
            className="flex-1 bg-transparent border-none outline-none text-3xl font-bold text-gray-900 dark:text-white placeholder-gray-400/50 mr-4"
            autoFocus
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                isPinned
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400'
              )}
              title={isPinned ? t('notes.unpin') : t('notes.pin')}
            >
              <Pin className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {note?.id && onDelete && (
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                title={t('notes.delete')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2" />

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CodeMirror Editor Area */}
        <div className="flex-1 overflow-hidden bg-transparent">
          <CodeMirror
            value={content}
            onChange={(value) => setContent(value)}
            extensions={[markdown(), markdownLivePreview, EditorView.lineWrapping]}
            theme="dark"
            height="100%"
            className="h-full"
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
            }}
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5 backdrop-blur-xl shrink-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {content.length} characters
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'px-8 py-2.5 rounded-xl font-medium transition-all duration-200',
                'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none'
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {t('notes.save')}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
