import { Minus, QrCode, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils';

export function FollowUsSection() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col gap-3">
            {/* WeChat Official Account */}
            <div className={cn(
                "rounded-xl p-4 space-y-4",
                "bg-white dark:bg-gray-900"
            )}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.followUs.wechat.title')}</h3>
                    <Minus className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('myTab.followUs.wechat.description')}
                </p>
                <div className="flex justify-center py-2">
                    <div className="w-32 h-32 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-gray-800 dark:text-gray-200" />
                    </div>
                </div>
            </div>

            {/* Share */}
            <div className={cn(
                "rounded-xl p-4 space-y-4",
                "bg-white dark:bg-gray-900"
            )}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.followUs.share.title')}</h3>
                    <Minus className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex gap-3">
                    <button className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                        <Star className="w-6 h-6" aria-hidden="true" />
                    </button>
                    <button className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                        <span className="font-bold">豆</span>
                    </button>
                    <button className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                        <span className="font-bold text-xl">We</span>
                    </button>
                </div>
            </div>

            {/* Follow Us (Weibo) */}
            <div className={cn(
                "rounded-xl p-4 space-y-4",
                "bg-white dark:bg-gray-900"
            )}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.followUs.follow.title')}</h3>
                    <Minus className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                    <button className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                        <span className="font-bold text-xl">We</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
