// FILE: src/components/Layout/Sidebar.tsx
// Navigation sidebar with organization info and tab navigation

import React, { useState, useEffect } from 'react';
import { useEcosystem } from '../../contexts/EcosystemContext';
import { useP2P } from '../../contexts/P2PContext';

interface AppState {
  view: 'homepage' | 'union';
  currentUnionId: string | null;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  appState: AppState;
}

// Union summary interface for homepage display
interface UnionSummary {
  id: string;
  name: string;
  type: 'tenant-union' | 'labor-union' | 'cooperative' | 'general';
  memberCount: number;
  lastActivity: string;
  created: string;
  isActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  appState
}) => {
  const { organization, dataStore, pluginManager } = useEcosystem();
  const { isConnected, peers } = useP2P();
  const [unions, setUnions] = useState<UnionSummary[]>([]);

  // Load unions list for homepage view
  useEffect(() => {
    if (appState.view === 'homepage') {
      loadUnions();
    }
  }, [appState.view]);

  const loadUnions = async () => {
    try {
      const unionsData = await dataStore.get('unionsList') || [];
      setUnions(unionsData);
    } catch (error) {
      console.error('Failed to load unions in sidebar:', error);
    }
  };

  // Original formatOrgType function
  const formatOrgType = (type: string) => {
    const types = {
      'tenant-union': 'Tenant Union',
      'labor-union': 'Labor Union',
      'cooperative': 'Cooperative',
      'general': 'General Organizing'
    };
    return types[type as keyof typeof types] || type;
  };

  // Handle union selection from sidebar
  const handleUnionSelect = async (unionId: string) => {
    try {
      const unionSummary = unions.find(u => u.id === unionId);
      if (!unionSummary) return;

      // Load the selected union's full data
      let orgData = await dataStore.get(`organization_${unionId}`);
      
      // If organization data doesn't exist, create it from summary
      if (!orgData) {
        orgData = {
          id: unionSummary.id,
          name: unionSummary.name,
          type: unionSummary.type,
          created: unionSummary.created,
          members: [],
          settings: {
            votingSystem: 'fptp',
            quorumThreshold: 0.5,
            proposalDuration: 7,
            allowAnonymousVoting: true
          }
        };
        await dataStore.set(`organization_${unionId}`, orgData);
      }
      
      // Set as current organization and switch to union view
      await dataStore.set('organization', orgData);
      await dataStore.set('currentUnionId', unionId);
      
      // Emit event to switch to union view
      pluginManager.emit('selectUnion', { unionId, organization: orgData });
    } catch (error) {
      console.error('Failed to select union from sidebar:', error);
    }
  };

  const handleCreateUnion = () => {
    pluginManager.emit('openCreateUnion');
  };

  const getUnionIcon = (type: string) => {
    const icons = {
      'tenant-union': '🏠',
      'labor-union': '⚒️',
      'cooperative': '🤝',
      'general': '🏛️'
    };
    return icons[type as keyof typeof icons] || '🏛️';
  };

  // Original union navigation tabs (when inside a union)
  const unionTabs = [
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
        {/* Conditional header based on app state */}
        {appState.view === 'homepage' ? (
          <div className="org-info">
            <div className="org-avatar" style={{ background: '#4CAF50' }}>
              EC
            </div>
            <div className="org-details">
              <h2>Ecosystem</h2>
              <div className="org-type">Union Platform</div>
            </div>
          </div>
        ) : (
          <div className="org-info">
            <div className="org-avatar">
              {organization?.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="org-details">
              <h2>{organization?.name}</h2>
              <div className="org-type">{formatOrgType(organization?.type || '')}</div>
              {/* Back to homepage button */}
              <button 
                onClick={() => onTabChange('homepage')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4CAF50',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '2px 0',
                  marginTop: '4px'
                }}
              >
                ← Back to Homepage
              </button>
            </div>
          </div>
        )}
        
        {/* Connection status */}
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? `Connected to ${peers.length} peers` : 'Disconnected'}</span>
        </div>
      </div>

      {/* Conditional navigation based on app state */}
      {appState.view === 'homepage' ? (
        // Homepage: Show unions list and create button
        <nav className="nav-tabs">
          <div style={{ 
            padding: '10px 20px', 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#888',
            borderBottom: '1px solid #333',
            marginBottom: '10px'
          }}>
            Your Unions
          </div>
          
          {unions.map(union => (
            <button
              key={union.id}
              className={`nav-tab ${appState.currentUnionId === union.id ? 'active' : ''}`}
              onClick={() => handleUnionSelect(union.id)}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px 20px',
                textAlign: 'left',
                minHeight: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <span className="nav-icon">{getUnionIcon(union.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {union.name}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#888',
                    marginTop: '2px'
                  }}>
                    {union.memberCount} member{union.memberCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          {/* Create Union Button */}
          <button
            className="nav-tab"
            onClick={handleCreateUnion}
            style={{
              marginTop: '10px',
              borderTop: '1px solid #333',
              color: '#4CAF50',
              fontWeight: '600'
            }}
          >
            <span className="nav-icon">➕</span>
            Create Union
          </button>
        </nav>
      ) : (
        // Union view with standard navigation tabs
        <nav className="nav-tabs">
          {unionTabs.map(tab => (
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
      )}
    </div>
  );
};