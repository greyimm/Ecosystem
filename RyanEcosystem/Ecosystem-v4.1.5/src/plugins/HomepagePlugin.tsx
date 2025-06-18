// FILE: src/plugins/HomepagePlugin.tsx
// Homepage plugin for displaying and managing unions - FUNCTIONAL + ORIGINAL UI RESTORED
// Calculates real member count and last activity while maintaining original beautiful styling

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

// Interface for tracking activity across different union data types
interface ActivityItem {
  timestamp: string;
  type: 'member' | 'proposal' | 'issue' | 'message' | 'vote';
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

  /**
   * Calculate the actual member count for a union by loading member data
   * @param unionId - Union ID to get member count for
   * @returns Promise<number> - Actual member count
   */
  const calculateMemberCount = useCallback(async (unionId: string): Promise<number> => {
    try {
      // Load members data for this specific union
      const members = await dataStore.get(`members_${unionId}`) || [];
      return Array.isArray(members) ? members.length : 0;
    } catch (error) {
      console.error(`Failed to load member count for union ${unionId}:`, error);
      return 0;
    }
  }, [dataStore]);

  /**
   * Calculate the actual last activity time for a union by checking all activity sources
   * @param unionId - Union ID to get last activity for
   * @returns Promise<string> - ISO timestamp of last activity
   */
  const calculateLastActivity = useCallback(async (unionId: string): Promise<string> => {
    try {
      const activities: ActivityItem[] = [];

      // Get all activity sources for this union
      const [members, proposals, issues, messages] = await Promise.all([
        dataStore.get(`members_${unionId}`) || [],
        dataStore.get(`proposals_${unionId}`) || [],
        dataStore.get(`issues_${unionId}`) || [],
        dataStore.get(`messages_${unionId}`) || []
      ]);

      // Add member join activities
      if (Array.isArray(members)) {
        members.forEach((member: any) => {
          if (member.joinedDate) {
            activities.push({
              timestamp: member.joinedDate,
              type: 'member'
            });
          }
          // Also check last active time for recent activity
          if (member.lastActive) {
            activities.push({
              timestamp: member.lastActive,
              type: 'member'
            });
          }
        });
      }

      // Add proposal activities
      if (Array.isArray(proposals)) {
        proposals.forEach((proposal: any) => {
          if (proposal.created) {
            activities.push({
              timestamp: proposal.created,
              type: 'proposal'
            });
          }
          // Add voting activity if votes exist
          if (proposal.votes && Array.isArray(proposal.votes)) {
            proposal.votes.forEach((vote: any) => {
              if (vote.timestamp) {
                activities.push({
                  timestamp: vote.timestamp,
                  type: 'vote'
                });
              }
            });
          }
        });
      }

      // Add issue activities
      if (Array.isArray(issues)) {
        issues.forEach((issue: any) => {
          if (issue.created) {
            activities.push({
              timestamp: issue.created,
              type: 'issue'
            });
          }
          if (issue.lastUpdated) {
            activities.push({
              timestamp: issue.lastUpdated,
              type: 'issue'
            });
          }
        });
      }

      // Add message activities
      if (Array.isArray(messages)) {
        messages.forEach((message: any) => {
          if (message.timestamp) {
            activities.push({
              timestamp: message.timestamp,
              type: 'message'
            });
          }
        });
      }

      // If no activities found, return creation time of union
      if (activities.length === 0) {
        const unionsList = await dataStore.get('unionsList') || [];
        const union = unionsList.find((u: any) => u.id === unionId);
        return union?.created || new Date().toISOString();
      }

      // Sort by timestamp and return the most recent
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return activities[0].timestamp;

    } catch (error) {
      console.error(`Failed to calculate last activity for union ${unionId}:`, error);
      // Fallback to current time if calculation fails
      return new Date().toISOString();
    }
  }, [dataStore]);

  /**
   * Load unions with actual calculated data instead of static values
   */
  const loadUnions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load basic union list
      const unionsList = await dataStore.get('unionsList') || [];
      
      if (!Array.isArray(unionsList)) {
        console.warn('Unions list is not an array, resetting to empty array');
        await dataStore.set('unionsList', []);
        setUnions([]);
        return;
      }

      // Calculate actual data for each union
      const unionsData: UnionSummary[] = await Promise.all(
        unionsList.map(async (union: any) => {
          // Calculate real member count and last activity
          const [memberCount, lastActivity] = await Promise.all([
            calculateMemberCount(union.id),
            calculateLastActivity(union.id)
          ]);

          return {
            id: union.id,
            name: union.name,
            type: union.type,
            memberCount: memberCount, // Now using actual calculated count
            lastActivity: lastActivity, // Now using actual calculated time
            created: union.created,
            isActive: memberCount > 0 // Union is active if it has members
          };
        })
      );

      console.log('Loaded unions with calculated data:', unionsData);
      setUnions(unionsData);
      
    } catch (error) {
      console.error('Failed to load unions:', error);
      showNotification('Failed to load unions', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dataStore, calculateMemberCount, calculateLastActivity, showNotification]);

  useEffect(() => {
    loadUnions();
    
    // Listen for plugin events
    const handleRefresh = (tabName: string) => {
      if (tabName === 'homepage') {
        console.log('Homepage refresh triggered, reloading unions...');
        loadUnions();
      }
    };

    const handleOpenCreateUnion = () => {
      setIsCreateModalOpen(true);
    };

    // Listen for union data changes that should trigger a refresh
    const handleUnionDataChange = () => {
      console.log('Union data changed, refreshing homepage...');
      loadUnions();
    };

    pluginManager.on('refresh', handleRefresh);
    pluginManager.on('openCreateUnion', handleOpenCreateUnion);
    pluginManager.on('unionDataChanged', handleUnionDataChange);

    return () => {
      pluginManager.off('refresh', handleRefresh);
      pluginManager.off('openCreateUnion', handleOpenCreateUnion);
      pluginManager.off('unionDataChanged', handleUnionDataChange);
    };
  }, [loadUnions, pluginManager]);

  const handleCreateUnion = async () => {
    if (!createForm.name.trim()) {
      showNotification('Union name is required', 'error');
      return;
    }

    try {
      const newUnionId = generateId();
      
      // Create union summary with initial values
      const newUnion: UnionSummary = {
        id: newUnionId,
        name: createForm.name.trim(),
        type: createForm.type,
        memberCount: 1, // Will be updated by calculateMemberCount on next load
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
      
      // Initialize members list for this union with current user
      if (currentUser) {
        const initialMembers = [{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: 'admin' as const,
          status: 'online' as const,
          joinedDate: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString()
        }];
        await dataStore.set(`members_${newUnionId}`, initialMembers);
      }
      
      // Initialize empty data structures for the new union
      await dataStore.set(`proposals_${newUnionId}`, []);
      await dataStore.set(`issues_${newUnionId}`, []);
      await dataStore.set(`messages_${newUnionId}`, []);
      
      // Close modal and reset form
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', type: 'tenant-union', description: '' });
      
      showNotification(`Union "${newUnion.name}" created successfully!`, 'success');
      
      // Reload unions to get updated calculated data
      await loadUnions();
      
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
    } catch (error) {
      console.error('Failed to select union:', error);
      showNotification('Failed to select union', 'error');
    }
  };

  // Original formatting functions preserved
  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const lastActivity = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const getUnionTypeLabel = (type: string) => {
    const labels = {
      'tenant-union': 'Tenant Union',
      'labor-union': 'Labor Union', 
      'cooperative': 'Cooperative',
      'general': 'General Union'
    };
    return labels[type as keyof typeof labels] || 'Union';
  };

  const unionTypeOptions = [
    { value: 'tenant-union', label: 'Tenant Union' },
    { value: 'labor-union', label: 'Labor Union' },
    { value: 'cooperative', label: 'Cooperative' },
    { value: 'general', label: 'General Union' }
  ];

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading unions...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h1>Welcome to the Ecosystem Platform</h1>
        <p>Create or join a union to start organizing democratically</p>
      </div>

      <div 
        className="union-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}
      >
        {/* Existing unions with ACTUAL calculated data */}
        {unions.map(union => (
          <div
            key={union.id}
            style={{ cursor: 'pointer' }}
            onClick={() => handleUnionSelect(union.id)}
            className="union-card"
          >
            <Card>
              <div style={{ position: 'relative' }}>
                <h3 style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '18px'
                }}>
                  {getUnionIcon(union.type)} {union.name}
                </h3>
                
                <div style={{ 
                  display: 'inline-block',
                  marginBottom: '15px'
                }}>
                  <span className={`union-type-badge ${union.type}`}>
                    {getUnionTypeLabel(union.type)}
                  </span>
                </div>
                
                {/* FUNCTIONAL DATA - Real member count and activity */}
                <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.4' }}>
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
            </Card>
          </div>
        ))}
        
        {/* Create Union Card - Original Styling Restored */}
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

      {/* Create Union Modal - Original Styling */}
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
    console.log('Homepage plugin initialized with functional data and original UI');
  }

  async destroy(): Promise<void> {
    console.log('Homepage plugin destroyed');
  }

  getComponent(): React.ComponentType<any> {
    return HomepageComponent;
  }
}