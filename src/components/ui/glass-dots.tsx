
import React from 'react';

export function GlassDots() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg"></div>
      <div 
        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
        style={{ animationDelay: '0.2s' }}
      ></div>
      <div 
        className="w-3 h-3 bg-white/30 backdrop-blur-md rounded-full animate-pulse shadow-lg" 
        style={{ animationDelay: '0.4s' }}
      ></div>
    </div>
  );
}
