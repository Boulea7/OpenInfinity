import { useCallback } from 'react';
import { Pin, ChevronRight, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettingsStore } from '../../stores';
import { db } from '../../services/database';
import { cn } from '../../utils';

interface PinnedNotesPanelProps {
  className?: string;
}

/**
 * PinnedNotesPanel Component
 * Displays pinned notes as floating cards in search view
 */
export function PinnedNotesPanel({ className }: PinnedNotesPanelProps) {
  const { t } = useTranslation();
  const { setViewSettings } = useSettingsStore();

  // Load pinned notes from database
  // Using useLiveQuery for real-time updates
  // Note: Use filter() for boolean comparison since Dexie's equals() doesn't accept boolean
  const pinnedNotes = useLiveQuery(
    () => db.notes.filter((note) => note.isPinned === true).sortBy('updatedAt').then((notes) => notes.reverse()),
    []
  );

  const handleClickNote = useCallback(() => {
    // Switch to notes view when clicking a pinned note
    setViewSettings({ currentView: 'notes' });
  }, [setViewSettings]);

  if (!pinnedNotes || pinnedNotes.length === 0) return null;

  return (
    <div className={cn(
      'fixed right-8 top-32 w-[340px] z-10 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-right-4',
      className
    )}>
      <div className="glass rounded-2xl p-5 shadow-2xl border border-white/20 dark:border-white/10 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <Pin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">
              {t('notes.pinnedNotes')}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5">
            {pinnedNotes.length}
          </span>
        </div>

        {/* Pinned Notes Grid (2 columns) */}
        <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto scrollbar-hide pr-1 -mr-1">
          {pinnedNotes.map((note) => (
            <div
              key={note.id}
              onClick={handleClickNote}
              className="group relative flex flex-col p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {note.title || t('notes.untitled')}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed min-h-[3rem]">
                {note.content?.slice(0, 100) || t('notes.noContent')}
              </p>

              {/* Hover Indicator */}
              <div className="absolute bottom-2 right-2 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <div className="p-1 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Notes */}
        <button
          onClick={handleClickNote}
          className="mt-5 w-full group flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 hover:bg-orange-50 dark:bg-white/5 dark:hover:bg-orange-500/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 border border-transparent hover:border-orange-200 dark:hover:border-orange-500/20"
        >
          <span>{t('notes.allNotes')}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
