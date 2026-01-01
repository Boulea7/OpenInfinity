import { Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils';

export function FeedbackSection() {
    const { t } = useTranslation();
    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-gray-900"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.feedback.title')}</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('myTab.feedback.description')}
            </p>

            <div className="flex gap-3">
                <button className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors duration-200">
                    {t('myTab.feedback.fiveStars')}
                </button>
                <button className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors duration-200">
                    {t('myTab.feedback.feedback')}
                </button>
            </div>
        </div>
    );
}
