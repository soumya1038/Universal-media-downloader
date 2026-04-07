import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="glass-card">
      <div className="flex flex-col md:flex-row gap-5">
        <div className="skeleton w-full md:w-72 aspect-video rounded-xl" />
        <div className="flex-1 flex flex-col gap-3 justify-center">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="flex gap-3">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
