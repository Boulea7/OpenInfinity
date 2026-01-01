import { Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils';

export function AboutSection() {
    const { t } = useTranslation();
    return (
        <div className={cn(
            "rounded-xl p-4 pb-2",
            "bg-white dark:bg-gray-900"
        )}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.about.title')}</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-500">{t('myTab.about.version')}</p>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    {t('myTab.about.aboutUs')}
                </a>
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    {t('myTab.about.contactUs')}
                </a>
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    {t('myTab.about.privacy')}
                </a>
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    {t('myTab.about.terms')}
                </a>
            </div>
            <div className="h-2" />
        </div>
    );
}
