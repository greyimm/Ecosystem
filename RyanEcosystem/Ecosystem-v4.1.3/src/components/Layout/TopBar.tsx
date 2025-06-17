// FILE: src/components/Layout/TopBar.tsx
// Top navigation bar with page title and actions

import React from 'react';
import { useEcosystem } from '../../contexts/EcosystemContext';
import { RefreshAnimation } from '../Common/RefreshAnimation';

interface TopBarProps {
  activeTab: string;
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onToggleSidebar }) => {
  const { pluginManager } = useEcosystem();

  const getPageTitle = (tab: string) => {
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

  const handleRefresh = () => {
    // Refresh current plugin data
    const plugin = pluginManager.getPlugin(activeTab);
    if (plugin) {
      pluginManager.emit('refresh', activeTab);
      
      // Show notification
      showNotification('Data refreshed successfully', 'success');
    }
  };

  const handleActionButton = (action: string) => {
    switch (action) {
      case 'newProposal':
        pluginManager.emit('openModal', { type: 'newProposal' });
        break;
      case 'newIssue':
        pluginManager.emit('openModal', { type: 'newIssue' });
        break;
      case 'inviteMember':
        pluginManager.emit('openModal', { type: 'inviteMember' });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.className = `notification ${type} show`;
      
      setTimeout(() => {
        notification.className = `notification ${type}`;
      }, 3000);
    }
  };

  const getActionButton = (tab: string) => {
        return null;
  };

  const actionButton = getActionButton(activeTab);
  const shouldShowRefresh = activeTab !== 'settings';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onToggleSidebar}>
          ☰
        </button>
        <h1>{getPageTitle(activeTab)}</h1>
      </div>
      <div className="topbar-actions">
        {shouldShowRefresh && (
          <RefreshAnimation
            onRefresh={() => {
              const plugin = pluginManager.getPlugin(activeTab);
              if (plugin) {
                pluginManager.emit('refresh', activeTab);
              }
            }}
            className="secondary"
          >
            🔄 Refresh
          </RefreshAnimation>
        )}
      </div>
    </div>
  );
};
