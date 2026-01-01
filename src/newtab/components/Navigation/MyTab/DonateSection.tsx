import { Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils';
import { useState } from 'react';

export function DonateSection() {
    const { t } = useTranslation();
    const [selectedAmount, setSelectedAmount] = useState<number | 'random'>(10);
    const amounts = [10, 15, 20, 25];

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-gray-900"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.donate.title')}</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('myTab.donate.description')}
            </p>

            {/* Illustration - Heart with coins concept */}
            <div className="w-full aspect-[2/1] rounded-lg bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-2 text-rose-400 dark:text-rose-300">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="text-2xl font-bold">❤️</span>
                </div>
            </div>

            {/* Amount Selection */}
            <div className="flex items-center justify-center gap-4 py-2">
                {amounts.map(amount => (
                    <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className="flex items-center gap-1.5 cursor-pointer"
                    >
                        <div className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center",
                            selectedAmount === amount
                                ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                                : "border-gray-300 dark:border-gray-600"
                        )}>
                            {selectedAmount === amount && <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">¥{amount}</span>
                    </button>
                ))}
                <button
                    onClick={() => setSelectedAmount('random')}
                    className="flex items-center gap-1.5 cursor-pointer"
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        selectedAmount === 'random'
                            ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                            : "border-gray-300 dark:border-gray-600"
                    )}>
                        {selectedAmount === 'random' && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('myTab.donate.random')}</span>
                </button>
            </div>

            <button className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium transition-colors duration-200">
                {t('myTab.donate.donateButton')}
            </button>
        </div>
    );
}
