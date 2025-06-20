// FILE: src/components/Layout/TopBar.tsx
// Top navigation bar with page title and refresh action only

import React from 'react';
import { useEcosystem } from '../../contexts/EcosystemContext';
import { RefreshAnimation } from '../Common/RefreshAnimation';

interface AppState {
  view: 'homepage' | 'union';
  currentUnionId: string | null;
}

interface TopBarProps {
  activeTab: string;
  appState: AppState;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  activeTab, 
  appState 
}) => {
  const { pluginManager } = useEcosystem();

  /**
   * Get the appropriate page title based on the active tab
   * @param tab - Current active tab
   * @returns Formatted page title
   */
  const getPageTitle = (tab: string) => {
    // Homepage title handling
    if (tab === 'homepage') {
      return 'Ecosystem Platform';
    }
    
    // Union-specific tab titles
    const titles = {
      dashboard: 'Dashboard',
      proposals: 'Proposals',
      issues: 'Issues',
      communications: 'Communications',
      members: 'Members',
      settings: 'Settings'
    };
    return titles[tab as keyof typeof titles] || 'Ecosystem';
  };

  /**
   * Handle refresh action for current tab/view
   * Emits refresh event to appropriate plugin
   */
  const handleRefresh = () => {
    try {
      // Handle refresh for both homepage and union tabs
      if (activeTab === 'homepage') {
        // Refresh homepage data
        const homepagePlugin = pluginManager.getPlugin('homepage');
        if (homepagePlugin) {
          pluginManager.emit('refresh', 'homepage');
          showNotification('Homepage refreshed successfully', 'success');
        } else {
          showNotification('Homepage plugin not available', 'error');
        }
      } else {
        // Refresh current union plugin data
        const plugin = pluginManager.getPlugin(activeTab);
        if (plugin) {
          pluginManager.emit('refresh', activeTab);
          showNotification('Data refreshed successfully', 'success');
        } else {
          showNotification('Plugin not available for refresh', 'error');
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      showNotification('Refresh failed', 'error');
    }
  };

  /**
   * Display notification to user
   * @param message - Notification message
   * @param type - Notification type (success, error, info)
   */
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.className = `notification ${type} show`;
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        notification.className = `notification ${type}`;
      }, 3000);
    }
  };

  /**
   * Determine if refresh button should be shown
   * Hide refresh for settings tab only
   */
  const shouldShowRefresh = activeTab !== 'settings';

  return (
    <div className="topbar">
      {/* Left side: Page title only */}
      <div className="topbar-left">
        <h1>{getPageTitle(activeTab)}</h1>
        
        {/* Show current view status indicator */}
        {appState.view === 'union' && appState.currentUnionId && (
          <span style={{ 
            fontSize: '12px', 
            color: '#888', 
            marginLeft: '10px',
            padding: '2px 8px',
            background: '#333',
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            Union View
          </span>
        )}
      </div>
      
      {/* Right side: Refresh button only */}
      <div className="topbar-actions">
        {shouldShowRefresh && (
          <RefreshAnimation
            onRefresh={handleRefresh}
            className="secondary"
          >
            🔄 Refresh
          </RefreshAnimation>
        )}
      </div>
    </div>
  );
};