import { Minus } from 'lucide-react';
import { cn } from '../../../utils';
import { useState } from 'react';

export function DonateSection() {
    const [selectedAmount, setSelectedAmount] = useState<number | 'random'>(10);
    const amounts = [10, 15, 20, 25];

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-gray-900"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">打赏</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
                您的支持是对我们极大的肯定
            </p>

            {/* Illustration Placeholder */}
            <div className="w-full aspect-[2/1] rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {/* Replace this with actual illustration image */}
                <img
                    src="https://ouch-cdn2.icons8.com/PZ2R_JzYdD3dYj1yM2Bq3b6fK8_sZ8xXj1yM2Bq3b.png"
                    alt="Donate Illustration"
                    className="h-full object-contain opacity-80"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <span className="text-xs text-gray-400 absolute">Illustration Placeholder</span>
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">¥随意</span>
                </button>
            </div>

            <button className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium transition-colors duration-200">
                我要打赏
            </button>
        </div>
    );
}
