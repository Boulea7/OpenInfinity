import React from 'react';

export const WallpaperSkeleton: React.FC = () => {
    return (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg)' }} />
        </div>
    );
};
