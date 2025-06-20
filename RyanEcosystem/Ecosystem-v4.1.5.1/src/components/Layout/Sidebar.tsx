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

  // Helper function to ensure emojis display properly
  const getEmojiForTab = (tabId: string) => {
    const emojiMap: { [key: string]: string } = {
      'dashboard': '📊',
      'proposals': '📋',
      'issues': '⚠️',
      'communications': '💬',
      'members': '👥',
      'settings': '⚙️'
    };
    return emojiMap[tabId] || '📄';
  };

  const getEmojiForUnionType = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      'tenant-union': '🏠',
      'labor-union': '⚒️',
      'cooperative': '🤝',
      'general': '🏛️'
    };
    return emojiMap[type] || '🏛️';
  };
  const unionTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'proposals', name: 'Proposals', icon: '📋' },
    { id: 'issues', name: 'Issues', icon: '⚠️' },
    { id: 'communications', name: 'Communications', icon: '💬' },
    { id: 'members', name: 'Members', icon: '👥' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ 
      width: isOpen ? '280px' : '60px', 
      transition: 'width 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="sidebar-header" style={{ position: 'relative', height: '120px' }}>
        {/* Collapse/Expand Button */}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#333';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#888';
          }}
        >
          {isOpen ? '←' : '→'}
        </button>

        {/* Original content - always present, positioned for full width */}
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '280px',
          minWidth: '280px',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}>
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

        {/* New collapsed content - show only when collapsed */}
        <div style={{ 
          display: isOpen ? 'none' : 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '15px 0 10px 0'
        }}>
          {/* Show EC or organization avatar */}
          <div 
            className="org-avatar" 
            style={{ 
              background: appState.view === 'homepage' ? '#4CAF50' : 'linear-gradient(45deg, #4CAF50, #2196F3)',
              margin: 0,
              marginTop: '15px'
            }}
          >
            {appState.view === 'homepage' ? 'EC' : organization?.name.substring(0, 2).toUpperCase()}
          </div>
          {/* Show connection dot */}
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
        </div>
      </div>

      {/* Original navigation - instantly hide when collapsed */}
      <div style={{ 
        position: 'absolute',
        top: '120px',
        left: 0,
        width: '280px',
        minWidth: '280px',
        display: isOpen ? 'block' : 'none'
      }}>
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
                onClick={(e) => {
                  handleUnionSelect(union.id);
                  // Remove focus from clicked button
                  e.currentTarget.blur();
                }}
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
              <span>Create Union</span>
            </button>
          </nav>
        ) : (
          // Union view with standard navigation tabs
          <nav className="nav-tabs">
            {unionTabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={(e) => {
                  onTabChange(tab.id);
                  // Reset background of ALL collapsed nav buttons AND remove focus
                  const collapsedNavButtons = e.currentTarget.parentElement?.querySelectorAll('button');
                  collapsedNavButtons?.forEach(btn => {
                    if (btn instanceof HTMLElement) {
                      btn.blur();
                      if (!btn.classList.contains('active')) {
                        btn.style.backgroundColor = 'transparent';
                      }
                    }
                  });
                }}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* New collapsed navigation - show only when collapsed */}
      <div style={{ display: isOpen ? 'none' : 'block', marginTop: '10px' }}>
        <nav className="nav-tabs" style={{ padding: '10px 0' }}>
          {appState.view === 'homepage' ? (
            // Collapsed homepage navigation - only emojis
            <>
              {unions.map(union => (
                <button
                  key={union.id}
                  className={`nav-tab ${appState.currentUnionId === union.id ? 'active' : ''}`}
                  onClick={() => handleUnionSelect(union.id)}
                  style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '12px 10px',
                    minHeight: '44px',
                    background: 'none',
                    border: 'none',
                    color: '#e0e0e0',
                    cursor: 'pointer'
                  }}
                >
                  {getEmojiForUnionType(union.type)}
                </button>
              ))}
              
              {/* Create Union Button - emoji only */}
              <button
                onClick={handleCreateUnion}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px 10px',
                  marginTop: '10px',
                  borderTop: '1px solid #333',
                  background: 'none',
                  border: 'none',
                  color: '#4CAF50',
                  minHeight: '44px',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ➕
              </button>
            </>
          ) : (
            // Collapsed union navigation - only emojis
            unionTabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px 10px',
                  minHeight: '44px',
                  background: 'none',
                  border: 'none',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {getEmojiForTab(tab.id)}
              </button>
            ))
          )}
        </nav>
      </div>
    </div>
  );
};