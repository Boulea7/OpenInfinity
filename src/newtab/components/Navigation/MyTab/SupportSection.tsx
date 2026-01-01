import { Minus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, copyToClipboard } from '../../../utils';

export function SupportSection() {
    const { t } = useTranslation();
    const handleCopyQQ = async () => {
        const ok = await copyToClipboard('123456789');
        alert(ok ? t('myTab.support.qqCopied') : t('myTab.support.qqCopyFailed'));
    };

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-gray-900"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.support.title')}</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            <button
                type="button"
                onClick={handleCopyQQ}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors duration-200",
                    "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                )}
            >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>{t('myTab.support.qqGroup')}</span>
            </button>
        </div>
    );
}
