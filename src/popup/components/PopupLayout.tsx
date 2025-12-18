import React from 'react';

interface PopupLayoutProps {
    children: React.ReactNode;
}

export default function PopupLayout({ children }: PopupLayoutProps) {
    return (
        <div className="relative w-[360px] min-h-[500px] overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none border border-white/10 rounded-2xl shadow-2xl">
            {/* Background Ambience - mimicking New Tab style */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Top-right glow */}
                <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-brand-orange-500/20 blur-[100px] rounded-full opacity-60 mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                {/* Bottom-left glow */}
                <div className="absolute -bottom-[100px] -left-[100px] w-[250px] h-[250px] bg-blue-500/10 blur-[90px] rounded-full opacity-40 mix-blend-screen" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center w-full h-full p-6 animate-fade-in">
                {children}
            </div>
        </div>
    );
}
