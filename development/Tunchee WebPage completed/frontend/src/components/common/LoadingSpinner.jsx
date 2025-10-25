import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        style={{
          border: '2px solid transparent',
          borderTop: `2px solid currentColor`,
          borderRadius: '50%'
        }}
      />
    </div>
  );
};

export default LoadingSpinner;