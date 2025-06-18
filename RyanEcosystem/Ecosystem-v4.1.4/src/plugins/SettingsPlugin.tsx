// FILE: src/plugins/SettingsPlugin.tsx
// Settings plugin for organization configuration
// MAJOR CHANGES: Added delete union functionality with confirmation modal

import React, { useState } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';

const SettingsComponent: React.FC = () => {
  const { organization, dataStore, updateOrganization, pluginManager } = useEcosystem();
  const [settings, setSettings] = useState({
    orgName: organization?.name || '',
    orgType: organization?.type || 'tenant-union',
    votingSystem: organization?.settings.votingSystem || 'fptp',
    quorumThreshold: organization?.settings.quorumThreshold || 0.5,
    proposalDuration: organization?.settings.proposalDuration || 7
  });

  // NEW: Delete union state management
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveSettings = async () => {
    if (organization) {
      const updatedOrg = {
        ...organization,
        name: settings.orgName,
        type: settings.orgType as any,
        settings: {
          ...organization.settings,
          votingSystem: settings.votingSystem as any,
          quorumThreshold: settings.quorumThreshold,
          proposalDuration: settings.proposalDuration
        }
      };
      
      // Update both the general organization data and union-specific data
      await dataStore.set('organization', updatedOrg);
      await dataStore.set(`organization_${organization.id}`, updatedOrg);
      
      // Update unions list with new name if changed
      const unionsList = await dataStore.get('unionsList') || [];
      const updatedUnionsList = unionsList.map((union: any) => 
        union.id === organization.id 
          ? { ...union, name: settings.orgName, type: settings.orgType }
          : union
      );
      await dataStore.set('unionsList', updatedUnionsList);
      
      updateOrganization(updatedOrg);
      showNotification('Settings saved successfully!', 'success');
      
      console.log('Settings saved:', updatedOrg);
    }
  };

  // NEW: Delete union functionality
  const handleDeleteUnion = async () => {
    if (!organization) return;

    // Validate confirmation text
    if (deleteConfirmText !== organization.name) {
      showNotification('Please type the exact union name to confirm deletion', 'error');
      return;
    }

    setIsDeleting(true);
    
    try {
      // Remove from unions list
      const unionsList = await dataStore.get('unionsList') || [];
      const updatedUnionsList = unionsList.filter((union: any) => union.id !== organization.id);
      await dataStore.set('unionsList', updatedUnionsList);
      
      // Remove union-specific organization data
      await dataStore.delete(`organization_${organization.id}`);
      
      // Remove any union-specific data (proposals, members, etc.)
      await dataStore.delete(`proposals_${organization.id}`);
      await dataStore.delete(`issues_${organization.id}`);
      await dataStore.delete(`members_${organization.id}`);
      await dataStore.delete(`messages_${organization.id}`);
      
      // Clear current organization if this was the active one
      const currentUnionId = await dataStore.get('currentUnionId');
      if (currentUnionId === organization.id) {
        await dataStore.delete('currentUnionId');
        await dataStore.delete('organization');
      }
      
      showNotification(`Union "${organization.name}" has been permanently deleted`, 'info');
      
      // Navigate back to homepage
      pluginManager.emit('returnToHomepage');
      
      console.log('Union deleted successfully:', organization.id);
    } catch (error) {
      console.error('Failed to delete union:', error);
      showNotification('Failed to delete union. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');
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

  const orgTypeOptions = [
    { value: 'tenant-union', label: 'Tenant Union' },
    { value: 'labor-union', label: 'Labor Union' },
    { value: 'cooperative', label: 'Cooperative' },
    { value: 'general', label: 'General Organizing' }
  ];

  const votingSystemOptions = [
    { value: 'fptp', label: 'First Past The Post' },
    { value: 'ranked', label: 'Ranked Choice' },
    { value: 'consensus', label: 'Consensus' }
  ];

  return (
    <div>
      {/* Organization Settings Card */}
      <Card title="Organization Settings">
        <FormInput
          label="Organization Name"
          value={settings.orgName}
          onChange={(value) => setSettings({...settings, orgName: value as string})}
        />
        
        <FormInput
          label="Organization Type"
          type="select"
          value={settings.orgType}
          onChange={(value) => setSettings({...settings, orgType: value as 'tenant-union' | 'labor-union' | 'cooperative' | 'general'})}
          options={orgTypeOptions}
        />
        
        <FormInput
          label="Voting System"
          type="select"
          value={settings.votingSystem}
          onChange={(value) => setSettings({...settings, votingSystem: value as 'fptp' | 'ranked' | 'consensus'})}
          options={votingSystemOptions}
        />
        
        <FormInput
          label="Quorum Threshold"
          type="number"
          value={settings.quorumThreshold}
          onChange={(value) => setSettings({...settings, quorumThreshold: value as number})}
        />
        
        <FormInput
          label="Default Proposal Duration (days)"
          type="number"
          value={settings.proposalDuration}
          onChange={(value) => setSettings({...settings, proposalDuration: value as number})}
        />

        <div style={{ marginTop: '20px' }}>
          <Button variant="primary" onClick={handleSaveSettings}>
            💾 Save Settings
          </Button>
        </div>
      </Card>

      {/* NEW: Danger Zone Card */}
      <Card title="Danger Zone" className="danger-zone">
        <div style={{ 
          padding: '20px',
          border: '2px solid #f44336',
          borderRadius: '8px',
          background: 'rgba(244, 67, 54, 0.1)'
        }}>
          <h4 style={{ 
            color: '#f44336', 
            marginBottom: '10px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            ⚠️ Delete Union
          </h4>
          <p style={{ 
            color: '#e0e0e0', 
            marginBottom: '15px',
            lineHeight: '1.5'
          }}>
            Permanently delete this union and all associated data. This action cannot be undone.
            All proposals, issues, messages, and member data will be lost forever.
          </p>
          <p style={{ 
            color: '#ff6b6b', 
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ⚠️ This will delete: Proposals • Issues • Messages • Member Data • All History
          </p>
          <Button 
            variant="danger" 
            onClick={() => setIsDeleteModalOpen(true)}
            className="font-bold"
          >
            🗑️ Delete Union Permanently
          </Button>
        </div>
      </Card>

      {/* NEW: Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        title="Confirm Union Deletion"
        size="medium"
      >
        <div style={{ color: '#e0e0e0' }}>
          <div style={{ 
            padding: '15px',
            background: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid #f44336',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#f44336', margin: '0 0 10px 0', fontSize: '16px' }}>
              ⚠️ PERMANENT DELETION WARNING
            </h4>
            <p style={{ margin: '0', fontSize: '14px' }}>
              You are about to permanently delete the union "{organization?.name}".
              This action cannot be undone and will result in the complete loss of all data.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ color: '#fff', marginBottom: '10px' }}>
              The following data will be permanently deleted:
            </h5>
            <ul style={{ color: '#ccc', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>All proposals and voting records</li>
              <li>All reported issues and resolutions</li>
              <li>All messages and communications</li>
              <li>All member data and history</li>
              <li>Organization settings and configuration</li>
              <li>All activity logs and analytics</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <FormInput
              label={`To confirm, type "${organization?.name}" exactly:`}
              value={deleteConfirmText}
              onChange={(value) => setDeleteConfirmText(value as string)}
              placeholder="Type the union name to confirm deletion"
            />
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'flex-end',
            marginTop: '30px'
          }}>
            <Button 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmText('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteUnion}
              disabled={deleteConfirmText !== organization?.name || isDeleting}
              className="font-bold"
            >
              {isDeleting ? '🗑️ Deleting...' : '🗑️ DELETE PERMANENTLY'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notification System */}
      <div id="notification" className="notification">
        <span id="notificationText"></span>
      </div>
    </div>
  );
};

export class SettingsPlugin implements Plugin {
  name = 'settings';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Settings plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Settings plugin destroyed');
  }

  getComponent() {
    return SettingsComponent;
  }
}