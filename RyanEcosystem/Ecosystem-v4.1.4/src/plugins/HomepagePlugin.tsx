// FILE: src/plugins/HomepagePlugin.tsx
// Homepage plugin for displaying and managing unions

import React, { useState, useEffect, useCallback } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';
import { Organization } from '../App';

// Extended interface for homepage management
interface UnionSummary {
  id: string;
  name: string;
  type: 'tenant-union' | 'labor-union' | 'cooperative' | 'general';
  memberCount: number;
  lastActivity: string;
  created: string;
  isActive: boolean;
}

const HomepageComponent: React.FC = () => {
  const { currentUser, dataStore, pluginManager } = useEcosystem();
  const [unions, setUnions] = useState<UnionSummary[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'tenant-union' as Organization['type'],
    description: ''
  });

  // Define helper functions first
  const generateId = useCallback((): string => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Use existing notification system
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.className = `notification ${type} show`;
      
      setTimeout(() => {
        notification.className = `notification ${type}`;
      }, 3000);
    }
  }, []);

  const loadUnions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load unions list from storage
      const unionsData = await dataStore.get('unionsList') || [];
      
      // If no unions exist, create a default one for demo
      if (unionsData.length === 0) {
        const defaultUnion: UnionSummary = {
          id: generateId(),
          name: 'Tenant Union Local 123',
          type: 'tenant-union',
          memberCount: 1,
          lastActivity: new Date().toISOString(),
          created: new Date().toISOString(),
          isActive: true
        };
        
        unionsData.push(defaultUnion);
        await dataStore.set('unionsList', unionsData);
        
        // Also ensure the full organization data exists
        const existingOrg = await dataStore.get('organization');
        if (!existingOrg) {
          const fullOrgData: Organization = {
            id: defaultUnion.id,
            name: defaultUnion.name,
            type: defaultUnion.type,
            created: defaultUnion.created,
            members: [],
            settings: {
              votingSystem: 'fptp',
              quorumThreshold: 0.5,
              proposalDuration: 7,
              allowAnonymousVoting: true
            }
          };
          await dataStore.set('organization', fullOrgData);
        }
      }
      
      setUnions(unionsData);
    } catch (error) {
      console.error('Failed to load unions:', error);
      showNotification('Failed to load unions', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dataStore, generateId, showNotification]); // All dependencies are now defined

  useEffect(() => {
    loadUnions();
    
    // Listen for plugin events
    pluginManager.on('refresh', (tabName: string) => {
      if (tabName === 'homepage') {
        loadUnions();
      }
    });

    // Listen for create union modal events
    pluginManager.on('openCreateUnion', () => {
      setIsCreateModalOpen(true);
    });

    return () => {
      pluginManager.off('refresh');
      pluginManager.off('openCreateUnion');
    };
  }, [loadUnions, pluginManager]); // Fixed dependencies

  const handleCreateUnion = async () => {
    if (!createForm.name.trim()) {
      showNotification('Union name is required', 'error');
      return;
    }

    try {
      const newUnionId = generateId();
      
      // Create union summary
      const newUnion: UnionSummary = {
        id: newUnionId,
        name: createForm.name.trim(),
        type: createForm.type,
        memberCount: 1,
        lastActivity: new Date().toISOString(),
        created: new Date().toISOString(),
        isActive: true
      };

      // Create full organization data
      const newOrganization: Organization = {
        id: newUnionId,
        name: newUnion.name,
        type: newUnion.type,
        created: newUnion.created,
        members: currentUser ? [currentUser] : [],
        settings: {
          votingSystem: 'fptp',
          quorumThreshold: 0.5,
          proposalDuration: 7,
          allowAnonymousVoting: true
        }
      };

      // Update unions list
      const updatedUnions = [...unions, newUnion];
      await dataStore.set('unionsList', updatedUnions);
      
      // Store the new organization data with union-specific key
      await dataStore.set(`organization_${newUnionId}`, newOrganization);
      
      setUnions(updatedUnions);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', type: 'tenant-union', description: '' });
      
      showNotification(`Union "${newUnion.name}" created successfully!`, 'success');
      
      console.log('New union created:', newUnion);
    } catch (error) {
      console.error('Failed to create union:', error);
      showNotification('Failed to create union', 'error');
    }
  };

  const handleUnionSelect = async (unionId: string) => {
    try {
      // Load the selected union's full data
      let orgData = await dataStore.get(`organization_${unionId}`);
      
      // If organization data doesn't exist for this union, create it
      if (!orgData) {
        const unionSummary = unions.find(u => u.id === unionId);
        if (unionSummary) {
          orgData = {
            id: unionSummary.id,
            name: unionSummary.name,
            type: unionSummary.type,
            created: unionSummary.created,
            members: currentUser ? [currentUser] : [],
            settings: {
              votingSystem: 'fptp',
              quorumThreshold: 0.5,
              proposalDuration: 7,
              allowAnonymousVoting: true
            }
          };
          await dataStore.set(`organization_${unionId}`, orgData);
        }
      }
      
      // Set as current organization and switch to union view
      await dataStore.set('organization', orgData);
      await dataStore.set('currentUnionId', unionId);
      
      // Emit event to switch to union view
      pluginManager.emit('selectUnion', { unionId, organization: orgData });
      
      console.log('Selected union:', unionId);
    } catch (error) {
      console.error('Failed to select union:', error);
      showNotification('Failed to load union', 'error');
    }
  };

  const formatOrgType = (type: string) => {
    const types = {
      'tenant-union': 'Tenant Union',
      'labor-union': 'Labor Union',
      'cooperative': 'Cooperative',
      'general': 'General Organizing'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
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

  const unionTypeOptions = [
    { value: 'tenant-union', label: 'Tenant Union' },
    { value: 'labor-union', label: 'Labor Union' },
    { value: 'cooperative', label: 'Cooperative' },
    { value: 'general', label: 'General Organizing' }
  ];

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading unions...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px', color: '#fff' }}>
          Welcome to Ecosystem
        </h1>
        <p style={{ fontSize: '16px', color: '#888', lineHeight: '1.5' }}>
          Select a union to access its dashboard, or create a new union to get started.
        </p>
      </div>

      {/* Unions Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {unions.map(union => (
          <div
            key={union.id}
            style={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              border: '1px solid #333',
              borderRadius: '8px'
            }}
            onClick={() => handleUnionSelect(union.id)}
            className="union-card"
          >
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{ 
                  fontSize: '32px',
                  minWidth: '40px',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {getUnionIcon(union.type)}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    color: '#fff',
                    wordBreak: 'break-word'
                  }}>
                    {union.name}
                  </h3>
                  
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#4CAF50',
                    marginBottom: '12px',
                    fontWeight: '500'
                  }}>
                    {formatOrgType(union.type)}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.4' }}>
                    <div style={{ marginBottom: '4px' }}>
                      👥 {union.memberCount} member{union.memberCount !== 1 ? 's' : ''}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      📅 Created {formatDate(union.created)}
                    </div>
                    <div>
                      ⏰ Active {formatLastActivity(union.lastActivity)}
                    </div>
                  </div>
                  
                  {union.isActive && (
                    <div style={{ 
                      marginTop: '10px',
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: '#4CAF50',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#fff'
                    }}>
                      ACTIVE
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
        
        {/* Create Union Card */}
        <div
          style={{ 
            cursor: 'pointer',
            border: '2px dashed #444',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '160px',
            transition: 'border-color 0.2s ease, background 0.2s ease',
            borderRadius: '8px'
          }}
          onClick={() => setIsCreateModalOpen(true)}
          className="create-union-card"
        >
          <Card>
            <div style={{ textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>➕</div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>
                Create New Union
              </div>
              <div style={{ fontSize: '13px' }}>
                Start organizing today
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Union Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Union"
      >
        <div style={{ marginBottom: '20px' }}>
          <FormInput
            label="Union Name"
            value={createForm.name}
            onChange={(value) => setCreateForm({...createForm, name: value as string})}
            placeholder="Enter union name..."
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <FormInput
            label="Organization Type"
            type="select"
            value={createForm.type}
            onChange={(value) => setCreateForm({...createForm, type: value as Organization['type']})}
            options={unionTypeOptions}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <FormInput
            label="Description (Optional)"
            type="textarea"
            value={createForm.description}
            onChange={(value) => setCreateForm({...createForm, description: value as string})}
            placeholder="Brief description of your union's purpose..."
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateUnion}
            disabled={!createForm.name.trim()}
          >
            🏛️ Create Union
          </Button>
        </div>
      </Modal>

      {/* Notification System (if not already in layout) */}
      <div id="notification" className="notification">
        <span id="notificationText"></span>
      </div>
    </div>
  );
};

// Homepage Plugin Class
export class HomepagePlugin implements Plugin {
  name = 'homepage';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Homepage plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Homepage plugin destroyed');
  }

  getComponent() {
    return HomepageComponent;
  }
}