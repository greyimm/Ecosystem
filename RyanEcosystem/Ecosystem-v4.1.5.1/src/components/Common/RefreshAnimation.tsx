// FILE: src/components/Common/RefreshAnimation.tsx
// Centralized refresh animation component

import React, { useState } from 'react';

interface RefreshAnimationProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
  duration?: number;
  className?: string;
  disabled?: boolean;
}

export const RefreshAnimation: React.FC<RefreshAnimationProps> = ({
  onRefresh,
  children,
  duration = 500,
  className = '',
  disabled = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error', fadeOut?: boolean} | null>(null);

const handleRefresh = async () => {
  if (isRefreshing || disabled) return; // Prevent double-clicks
  
  setIsRefreshing(true);
  setStatusMessage(null); // Clear any previous status
  
  // Execute the actual refresh logic
  try {
    await onRefresh();
    
    // Show loading animation for specified duration
    setTimeout(() => {
      setIsRefreshing(false);
      setStatusMessage({ text: 'Refresh was Successful', type: 'success' });
      
      // Start fade out after 1.2 seconds, then remove after transition
      setTimeout(() => {
        setStatusMessage(prev => prev ? { ...prev, fadeOut: true } : null);
        setTimeout(() => {
          setStatusMessage(null);
        }, 300); // Match transition duration
      }, 1200);
    }, duration);
    
  } catch (error) {
    console.error('Refresh failed:', error);
    
    setTimeout(() => {
      setIsRefreshing(false);
      setStatusMessage({ text: 'Refresh Failed!', type: 'error' });
      
      // Start fade out after 1.2 seconds, then remove after transition
      setTimeout(() => {
        setStatusMessage(prev => prev ? { ...prev, fadeOut: true } : null);
        setTimeout(() => {
          setStatusMessage(null);
        }, 300); // Match transition duration
      }, 1200);
    }, duration);
  }
};

return (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
{statusMessage && (
  <span 
    style={{ 
      fontSize: '14px', 
      fontWeight: '500',
      color: statusMessage.type === 'success' ? '#4CAF50' : '#f44336',
      opacity: statusMessage.fadeOut === true ? 0 : 1,
      transform: statusMessage.fadeOut === true ? 'translateX(-10px)' : 'translateX(0)',
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }}
  >
    {statusMessage.text}
  </span>
)}
    <button
      className={`btn ${className}`}
      onClick={handleRefresh}
      disabled={isRefreshing || disabled}
    >
      {isRefreshing ? '⏳ Refreshing...' : children}
    </button>
  </div>
);
};