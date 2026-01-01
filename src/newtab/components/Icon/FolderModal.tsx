import type { Folder, Icon } from '../../services/database';
import { FolderExpandedView } from './FolderExpandedView';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
  onEditIcon?: (_icon: Icon) => void;
  onAddIcon?: () => void;
  originRect?: DOMRect | null;
}

/**
 * FolderModal Component
 * iOS-style folder expansion modal using FolderExpandedView.
 * This is a thin wrapper that delegates to FolderExpandedView
 * for backward compatibility with existing code.
 */
export function FolderModal({
  isOpen,
  onClose,
  folder,
  onEditIcon,
  originRect,
}: FolderModalProps) {
  // Don't render if no folder is provided
  if (!folder) return null;

  return (
    <FolderExpandedView
      folder={folder}
      isOpen={isOpen}
      onClose={onClose}
      onEditIcon={onEditIcon}
      originRect={originRect}
    />
  );
}

export default FolderModal;
