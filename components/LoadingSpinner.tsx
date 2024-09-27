import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

export default LoadingSpinner;
