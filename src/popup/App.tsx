import { useTranslation } from 'react-i18next';
import AddIconForm from './components/AddIconForm';

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="w-[400px] min-h-[500px] bg-white">
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">{t('popup.title')}</h1>
        <AddIconForm />
      </div>
    </div>
  );
}
