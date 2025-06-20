// FILE: src/index.tsx
// React application entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import styles in correct order for cascading
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/themes.css';
import './styles/utilities.css';

// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // In a real app, send metrics to your analytics service
  console.log('Performance metric:', metric);
}

// Measure and log performance metrics
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Initialize React application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Error boundary for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  // In a real app, report to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // In a real app, report to error tracking service
});