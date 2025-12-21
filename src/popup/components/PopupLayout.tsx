import React from 'react';

interface PopupLayoutProps {
    children: React.ReactNode;
}

export default function PopupLayout({ children }: PopupLayoutProps) {
    return (
        <div className="relative w-[360px] min-h-[500px] overflow-hidden bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none shadow-xl">
            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full h-full p-4 animate-fade-in">
                {children}
            </div>
        </div>
    );
}
