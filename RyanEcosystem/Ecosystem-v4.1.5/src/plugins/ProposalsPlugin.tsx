// FILE: src/plugins/ProposalsPlugin.tsx
// Proposals plugin for creating and voting on proposals - UPDATED with union data change events

import React, { useState, useEffect, useCallback } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';
import { Proposal } from '../App';

const ProposalsComponent: React.FC = () => {
  const { organization, governance, dataStore, pluginManager } = useEcosystem();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    duration: 7,
    budget: 0
  });

  /**
   * Load proposals for the current organization
   * Uses union-specific storage key if we're in a union context
   */
  const loadProposals = useCallback(async () => {
    try {
      // Use union-specific storage key if we have an organization ID
      const storageKey = organization?.id ? `proposals_${organization.id}` : 'proposals';
      const savedProposals = await dataStore.get(storageKey) || [];
      setProposals(savedProposals);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    }
  }, [organization?.id, dataStore]);

  useEffect(() => {
    loadProposals();
    
    // Listen for refresh events
    const handleRefresh = (tabName: string) => {
      if (tabName === 'proposals') {
        loadProposals();
      }
    };

    // Listen for new proposal modal events
    const handleOpenModal = (data: any) => {
      if (data.type === 'newProposal') {
        setIsModalOpen(true);
      }
    };

    pluginManager.on('refresh', handleRefresh);
    pluginManager.on('openModal', handleOpenModal);

    return () => {
      pluginManager.off('refresh', handleRefresh);
      pluginManager.off('openModal', handleOpenModal);
    };
  }, [loadProposals, pluginManager]);

  /**
   * Save proposals to storage and emit union data change event
   */
  const saveProposals = async (newProposals: Proposal[]) => {
    try {
      // Use union-specific storage key if we have an organization ID
      const storageKey = organization?.id ? `proposals_${organization.id}` : 'proposals';
      await dataStore.set(storageKey, newProposals);
      
      // Emit event to notify homepage and other components that union data changed
      pluginManager.emit('unionDataChanged', {
        type: 'proposals',
        unionId: organization?.id,
        count: newProposals.length,
        timestamp: new Date().toISOString()
      });
      
      console.log('Proposals saved and union data change event emitted');
    } catch (error) {
      console.error('Failed to save proposals:', error);
    }
  };

  const handleCreateProposal = async () => {
    if (!newProposal.title.trim() || !newProposal.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const proposal = await governance.createProposal({
        title: newProposal.title,
        description: newProposal.description,
        author: 'current-user',
        votingDeadline: new Date(Date.now() + newProposal.duration * 24 * 60 * 60 * 1000).toISOString(),
        budgetRequired: newProposal.budget || undefined
      });

      const updatedProposals = [...proposals, proposal];
      setProposals(updatedProposals);
      
      // Save proposals and emit union data change event
      await saveProposals(updatedProposals);

      setIsModalOpen(false);
      setNewProposal({ title: '', description: '', duration: 7, budget: 0 });
      
      // Show success notification
      showNotification('Proposal created successfully!', 'success');
    } catch (error) {
      console.error('Failed to create proposal:', error);
      showNotification('Failed to create proposal', 'error');
    }
  };

  const handleVote = async (proposalId: string, choice: 'approve' | 'reject' | 'abstain') => {
    try {
      const vote = await governance.castVote(proposalId, 'current-user', choice);
      
      const updatedProposals = proposals.map(proposal => {
        if (proposal.id === proposalId) {
          return {
            ...proposal,
            votes: [...proposal.votes.filter(v => v.voterId !== 'current-user'), vote]
          };
        }
        return proposal;
      });

      setProposals(updatedProposals);
      
      // Save proposals and emit union data change event (voting is activity)
      await saveProposals(updatedProposals);
      
      showNotification(`Vote cast: ${choice}`, 'success');
    } catch (error) {
      console.error('Failed to cast vote:', error);
      showNotification('Failed to cast vote', 'error');
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

  const getVoteCount = (proposal: Proposal, choice: string) => {
    return proposal.votes.filter(vote => vote.choice === choice).length;
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Create New Proposal
        </Button>
      </div>

      <div className="proposal-list">
        {proposals.map(proposal => (
          <Card key={proposal.id} className="proposal-card">
            <div className="proposal-header">
              <div>
                <h3 className="proposal-title">{proposal.title}</h3>
                <div className="proposal-meta">
                  By {proposal.author} • Created {new Date(proposal.created).toLocaleDateString()}
                  {proposal.votingDeadline && (
                    <> • Voting deadline: {new Date(proposal.votingDeadline).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              <div className={`proposal-status status-${proposal.status}`}>
                {proposal.status}
              </div>
            </div>
            
            <p>{proposal.description}</p>
            
            {proposal.budgetRequired && (
              <div style={{ margin: '10px 0', color: '#888' }}>
                Budget Required: ${proposal.budgetRequired}
              </div>
            )}

            <div className="vote-summary" style={{ margin: '15px 0' }}>
              <span style={{ color: '#4CAF50' }}>Approve: {getVoteCount(proposal, 'approve')} | </span>
              <span style={{ color: '#f44336' }}>Reject: {getVoteCount(proposal, 'reject')} | </span>
              <span style={{ color: '#888' }}>Abstain: {getVoteCount(proposal, 'abstain')}</span>
            </div>

            {proposal.status === 'active' && (
              <div className="vote-buttons" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <Button 
                  variant="primary" 
                  size="small"
                  onClick={() => handleVote(proposal.id, 'approve')}
                >
                  ✅ Approve
                </Button>
                <Button 
                  variant="danger" 
                  size="small"
                  onClick={() => handleVote(proposal.id, 'reject')}
                >
                  ❌ Reject
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleVote(proposal.id, 'abstain')}
                >
                  🤐 Abstain
                </Button>
              </div>
            )}

            {proposal.status === 'passed' && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#4CAF50', color: 'white', borderRadius: '4px' }}>
                ✅ This proposal has passed!
              </div>
            )}

            {proposal.status === 'failed' && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#f44336', color: 'white', borderRadius: '4px' }}>
                ❌ This proposal was rejected.
              </div>
            )}
          </Card>
        ))}
        
        {proposals.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p>No proposals yet</p>
              <p>Create the first proposal to get started with democratic decision-making!</p>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Proposal"
      >
        <FormInput
          label="Title"
          value={newProposal.title}
          onChange={(value) => setNewProposal({...newProposal, title: value as string})}
          placeholder="Enter proposal title"
          required
        />
        
        <FormInput
          label="Description"
          type="textarea"
          value={newProposal.description}
          onChange={(value) => setNewProposal({...newProposal, description: value as string})}
          placeholder="Describe your proposal in detail..."
          required
          rows={5}
        />
        
        <FormInput
          label="Voting Duration (days)"
          type="number"
          value={newProposal.duration}
          onChange={(value) => setNewProposal({...newProposal, duration: value as number})}
        />
        
        <FormInput
          label="Budget Required (optional)"
          type="number"
          value={newProposal.budget}
          onChange={(value) => setNewProposal({...newProposal, budget: value as number})}
          placeholder="Enter amount if budget is needed"
        />

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={handleCreateProposal}>
            📋 Create Proposal
          </Button>
          <Button onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export class ProposalsPlugin implements Plugin {
  name = 'proposals';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Proposals plugin initialized with union data change event emission');
  }

  async destroy(): Promise<void> {
    console.log('Proposals plugin destroyed');
  }

  getComponent() {
    return ProposalsComponent;
  }
}