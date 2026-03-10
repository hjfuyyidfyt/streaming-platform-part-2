import React from 'react';

const SkeletonVideoCard = () => {
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse">
            <div className="aspect-video bg-gray-700 w-full" />
            <div className="p-3 space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <div className="h-3 bg-gray-700 rounded w-1/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/5" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonVideoCard;
