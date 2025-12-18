import { Minus } from 'lucide-react';
import { cn } from '../../../utils';
import { useState } from 'react';

export function DonateSection() {
    const [selectedAmount, setSelectedAmount] = useState<number | 'random'>(10);
    const amounts = [10, 15, 20, 25];

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-zinc-900",
            "border border-zinc-100 dark:border-zinc-800",
            "shadow-sm"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">打赏</h3>
                <Minus className="w-4 h-4 text-zinc-400" />
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                您的支持是对我们极大的肯定
            </p>

            {/* Illustration Placeholder */}
            <div className="w-full aspect-[2/1] rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {/* Replace this with actual illustration image */}
                <img
                    src="https://ouch-cdn2.icons8.com/PZ2R_JzYdD3dYj1yM2Bq3b6fK8_sZ8xXj1yM2Bq3b.png"
                    alt="Donate Illustration"
                    className="h-full object-contain opacity-80"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <span className="text-xs text-zinc-400 absolute">Illustration Placeholder</span>
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
                                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                                : "border-zinc-300 dark:border-zinc-600"
                        )}>
                            {selectedAmount === amount && <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">¥{amount}</span>
                    </button>
                ))}
                <button
                    onClick={() => setSelectedAmount('random')}
                    className="flex items-center gap-1.5 cursor-pointer"
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        selectedAmount === 'random'
                            ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                            : "border-zinc-300 dark:border-zinc-600"
                    )}>
                        {selectedAmount === 'random' && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">¥随意</span>
                </button>
            </div>

            <button className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors">
                我要打赏
            </button>
        </div>
    );
}
