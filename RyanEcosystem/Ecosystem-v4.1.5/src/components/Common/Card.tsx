// FILE: src/components/Common/Card.tsx
// Reusable card component

import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', actions }) => {
  return (
    <div className={`dashboard-card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};
