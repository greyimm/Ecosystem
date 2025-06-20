// FILE: src/plugins/IssuesPlugin.tsx
// Issues plugin for reporting and tracking issues - UPDATED with union data change events

import React, { useState, useEffect, useCallback } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reporter: string;
  created: string;
  lastUpdated?: string;
  assignedTo?: string;
  linkedCampaign?: string;
}

const IssuesComponent: React.FC = () => {
  const { organization, dataStore, pluginManager } = useEcosystem();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isNewIssueModalOpen, setIsNewIssueModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  /**
   * Load issues for the current organization
   * Uses union-specific storage key if we're in a union context
   */
  const loadIssues = useCallback(async () => {
    try {
      // Use union-specific storage key if we have an organization ID
      const storageKey = organization?.id ? `issues_${organization.id}` : 'issues';
      const savedIssues = await dataStore.get(storageKey) || [
        {
          id: '1',
          title: 'Heating not working in Building A',
          description: 'Multiple units reporting no heat for 3 days',
          priority: 'high' as const,
          status: 'open' as const,
          reporter: 'Jane Doe',
          created: '2025-01-15'
        },
        {
          id: '2', 
          title: 'Broken elevator',
          description: 'Main elevator stuck between floors 3-4',
          priority: 'medium' as const,
          status: 'in-progress' as const,
          reporter: 'John Smith',
          created: '2025-01-14'
        }
      ];
      setIssues(savedIssues);
    } catch (error) {
      console.error('Failed to load issues:', error);
    }
  }, [organization?.id, dataStore]);

  useEffect(() => {
    loadIssues();
    
    // Listen for plugin events
    const handleOpenModal = (data: any) => {
      if (data.type === 'newIssue') {
        setIsNewIssueModalOpen(true);
      }
    };

    const handleRefresh = (tabName: string) => {
      if (tabName === 'issues') {
        loadIssues();
      }
    };

    pluginManager.on('openModal', handleOpenModal);
    pluginManager.on('refresh', handleRefresh);

    return () => {
      pluginManager.off('openModal', handleOpenModal);
      pluginManager.off('refresh', handleRefresh);
    };
  }, [loadIssues, pluginManager]);

  /**
   * Save issues to storage and emit union data change event
   */
  const saveIssues = async (newIssues: Issue[]) => {
    try {
      // Use union-specific storage key if we have an organization ID
      const storageKey = organization?.id ? `issues_${organization.id}` : 'issues';
      await dataStore.set(storageKey, newIssues);
      
      // Emit event to notify homepage and other components that union data changed
      pluginManager.emit('unionDataChanged', {
        type: 'issues',
        unionId: organization?.id,
        count: newIssues.length,
        timestamp: new Date().toISOString()
      });
      
      console.log('Issues saved and union data change event emitted');
    } catch (error) {
      console.error('Failed to save issues:', error);
    }
  };

  const handleCreateIssue = async () => {
    if (!newIssue.title || !newIssue.description) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const issue: Issue = {
      id: Date.now().toString(),
      title: newIssue.title,
      description: newIssue.description,
      priority: newIssue.priority,
      status: 'open',
      reporter: 'Current User',
      created: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString()
    };

    const updatedIssues = [issue, ...issues];
    setIssues(updatedIssues);
    
    // Save issues and emit union data change event
    await saveIssues(updatedIssues);

    setIsNewIssueModalOpen(false);
    setNewIssue({ title: '', description: '', priority: 'medium' });
    showNotification('Issue reported successfully', 'success');
  };

  const handleUpdateStatus = async (issueId: string, newStatus: Issue['status']) => {
    const updatedIssues = issues.map(issue => 
      issue.id === issueId ? { 
        ...issue, 
        status: newStatus,
        lastUpdated: new Date().toISOString()
      } : issue
    );
    
    setIssues(updatedIssues);
    
    // Save issues and emit union data change event
    await saveIssues(updatedIssues);
    
    setIsStatusModalOpen(false);
    setSelectedIssue(null);
    showNotification('Issue status updated', 'success');
  };

  const handleLinkToCampaign = (issueId: string) => {
    // In a real implementation, this would show a campaign selection modal
    showNotification('Campaign linking feature coming soon', 'info');
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

  const openStatusModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsStatusModalOpen(true);
  };

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4CAF50';
      default: return '#888';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f44336';
      case 'in-progress': return '#ff9800';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#888';
      default: return '#888';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Button variant="primary" onClick={() => setIsNewIssueModalOpen(true)}>
          📝 Report New Issue
        </Button>
      </div>

      <div className="issues-list">
        {issues.map(issue => (
          <Card key={issue.id} className="issue-card">
            <div className="issue-header">
              <div>
                <h3>{issue.title}</h3>
                <div className="issue-meta">
                  Reported by {issue.reporter} • {issue.created}
                  {issue.lastUpdated && issue.lastUpdated !== issue.created && (
                    <> • Updated {new Date(issue.lastUpdated).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              <div 
                className={`issue-priority priority-${issue.priority}`}
                style={{ 
                  background: getPriorityColor(issue.priority),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {issue.priority} priority
              </div>
            </div>
            
            <p style={{ margin: '15px 0', lineHeight: '1.5' }}>{issue.description}</p>
            
            <div className="issue-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <span 
                className={`issue-status status-${issue.status}`}
                style={{
                  background: getStatusColor(issue.status),
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {issue.status.replace('-', ' ')}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button size="small" onClick={() => openStatusModal(issue)}>
                  📊 Update Status
                </Button>
                <Button size="small" onClick={() => handleLinkToCampaign(issue.id)}>
                  🔗 Link to Campaign
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {issues.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p>No issues reported yet</p>
              <p>Report the first issue to start tracking problems and solutions!</p>
            </div>
          </Card>
        )}
      </div>

      {/* New Issue Modal */}
      <Modal
        isOpen={isNewIssueModalOpen}
        onClose={() => setIsNewIssueModalOpen(false)}
        title="Report New Issue"
      >
        <FormInput
          label="Issue Title"
          value={newIssue.title}
          onChange={(value) => setNewIssue({...newIssue, title: value as string})}
          placeholder="Brief description of the issue"
          required
        />
        
        <FormInput
          label="Description"
          type="textarea"
          value={newIssue.description}
          onChange={(value) => setNewIssue({...newIssue, description: value as string})}
          placeholder="Detailed description of the issue, including affected areas and urgency"
          required
          rows={5}
        />
        
        <FormInput
          label="Priority Level"
          type="select"
          value={newIssue.priority}
          onChange={(value) => setNewIssue({...newIssue, priority: value as 'low' | 'medium' | 'high'})}
          options={priorityOptions}
        />

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={handleCreateIssue}>
            📝 Report Issue
          </Button>
          <Button onClick={() => setIsNewIssueModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Issue Status"
        size="small"
      >
        {selectedIssue && (
          <div>
            <p><strong>Issue:</strong> {selectedIssue.title}</p>
            <p style={{ margin: '10px 0', color: '#888' }}>
              Current status: <span 
                className={`issue-status status-${selectedIssue.status}`}
                style={{
                  background: getStatusColor(selectedIssue.status),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {selectedIssue.status.replace('-', ' ')}
              </span>
            </p>
            
            <div style={{ marginTop: '20px' }}>
              <p style={{ marginBottom: '15px', fontWeight: '500' }}>Update to:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {statusOptions.map(status => (
                  <Button
                    key={status.value}
                    variant={status.value === selectedIssue.status ? 'primary' : 'secondary'}
                    onClick={() => handleUpdateStatus(selectedIssue.id, status.value as Issue['status'])}
                    disabled={status.value === selectedIssue.status}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export class IssuesPlugin implements Plugin {
  name = 'issues';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Issues plugin initialized with union data change event emission');
  }

  async destroy(): Promise<void> {
    console.log('Issues plugin destroyed');
  }

  getComponent() {
    return IssuesComponent;
  }
}