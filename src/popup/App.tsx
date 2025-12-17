import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddIconForm from './components/AddIconForm';
import IconEditPage from './components/IconEditPage';

type Page = 'main' | 'edit';

export default function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('main');
  const [editImageUrl, setEditImageUrl] = useState<string>('');

  const handleEditIcon = (imageUrl: string) => {
    setEditImageUrl(imageUrl);
    setCurrentPage('edit');
  };

  const handleEditConfirm = (croppedImageData: string, backgroundColor: string) => {
    // TODO: Pass edited image back to AddIconForm
    console.log('Edited icon:', { croppedImageData, backgroundColor });
    setCurrentPage('main');
  };

  const handleEditCancel = () => {
    setCurrentPage('main');
  };

  return (
    <div className="w-[400px] min-h-[500px] bg-white">
      {currentPage === 'main' && (
        <div className="p-4">
          <h1 className="text-xl font-semibold mb-4">{t('popup.title')}</h1>
          <AddIconForm onEditIcon={handleEditIcon} />
        </div>
      )}
      {currentPage === 'edit' && (
        <IconEditPage
          imageUrl={editImageUrl}
          onConfirm={handleEditConfirm}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}
