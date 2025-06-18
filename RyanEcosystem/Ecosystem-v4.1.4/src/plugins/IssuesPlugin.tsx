// FILE: src/plugins/IssuesPlugin.tsx
// Issues plugin for reporting and tracking issues

import React, { useState, useEffect } from 'react';
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
  assignedTo?: string;
  linkedCampaign?: string;
}

const IssuesComponent: React.FC = () => {
  const { dataStore, pluginManager } = useEcosystem();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isNewIssueModalOpen, setIsNewIssueModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    loadIssues();
    
    // Listen for plugin events
    pluginManager.on('openModal', (data: any) => {
      if (data.type === 'newIssue') {
        setIsNewIssueModalOpen(true);
      }
    });

    pluginManager.on('refresh', (tabName: string) => {
      if (tabName === 'issues') {
        loadIssues();
      }
    });
  }, []);

  const loadIssues = async () => {
    const savedIssues = await dataStore.get('issues') || [
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
      created: new Date().toISOString().split('T')[0]
    };

    const updatedIssues = [issue, ...issues];
    setIssues(updatedIssues);
    await dataStore.set('issues', updatedIssues);

    setIsNewIssueModalOpen(false);
    setNewIssue({ title: '', description: '', priority: 'medium' });
    showNotification('Issue reported successfully', 'success');
  };

  const handleUpdateStatus = async (issueId: string, newStatus: Issue['status']) => {
    const updatedIssues = issues.map(issue => 
      issue.id === issueId ? { ...issue, status: newStatus } : issue
    );
    setIssues(updatedIssues);
    await dataStore.set('issues', updatedIssues);
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
                </div>
              </div>
              <div className={`issue-priority priority-${issue.priority}`}>
                {issue.priority} priority
              </div>
            </div>
            
            <p>{issue.description}</p>
            
            <div className="issue-actions">
              <span className={`issue-status status-${issue.status}`}>
                {issue.status.replace('-', ' ')}
              </span>
              <Button size="small" onClick={() => openStatusModal(issue)}>
                📊 Update Status
              </Button>
              <Button size="small" onClick={() => handleLinkToCampaign(issue.id)}>
                🔗 Link to Campaign
              </Button>
            </div>
          </Card>
        ))}
        
        {issues.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <p>No issues reported yet</p>
              <p>Report the first issue to get started</p>
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
              Current status: <span className={`issue-status status-${selectedIssue.status}`}>
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
    console.log('Issues plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Issues plugin destroyed');
  }

  getComponent() {
    return IssuesComponent;
  }
}
