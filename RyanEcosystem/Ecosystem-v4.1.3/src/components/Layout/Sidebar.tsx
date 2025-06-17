// FILE: src/components/Layout/Sidebar.tsx
// Navigation sidebar with organization info and tab navigation

import React from 'react';
import { useEcosystem } from '../../contexts/EcosystemContext';
import { useP2P } from '../../contexts/P2PContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onToggle
}) => {
  const { organization } = useEcosystem();
  const { isConnected, peers } = useP2P();

  const formatOrgType = (type: string) => {
    const types = {
      'tenant-union': 'Tenant Union',
      'labor-union': 'Labor Union',
      'cooperative': 'Cooperative',
      'general': 'General Organizing'
    };
    return types[type as keyof typeof types] || type;
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'proposals', name: 'Proposals', icon: '📋' },
    { id: 'issues', name: 'Issues', icon: '⚠️' },
    { id: 'communications', name: 'Communications', icon: '💬' },
    { id: 'members', name: 'Members', icon: '👥' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="org-info">
          <div className="org-avatar">
            {organization?.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="org-details">
            <h2>{organization?.name}</h2>
            <div className="org-type">{formatOrgType(organization?.type || '')}</div>
          </div>
        </div>
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? `Connected to ${peers.length} peers` : 'Disconnected'}</span>
        </div>
      </div>

      <nav className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
};