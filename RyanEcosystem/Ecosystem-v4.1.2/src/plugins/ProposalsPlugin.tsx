// FILE: src/plugins/ProposalsPlugin.tsx
// Proposals plugin for creating and voting on proposals

import React, { useState, useEffect } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';
import { Proposal } from '../App';

const ProposalsComponent: React.FC = () => {
  const { governance, dataStore } = useEcosystem();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    duration: 7,
    budget: 0
  });

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    const savedProposals = await dataStore.get('proposals') || [];
    setProposals(savedProposals);
  };

  const handleCreateProposal = async () => {
    const proposal = await governance.createProposal({
      title: newProposal.title,
      description: newProposal.description,
      author: 'current-user',
      votingDeadline: new Date(Date.now() + newProposal.duration * 24 * 60 * 60 * 1000).toISOString(),
      budgetRequired: newProposal.budget || undefined
    });

    const updatedProposals = [...proposals, proposal];
    setProposals(updatedProposals);
    await dataStore.set('proposals', updatedProposals);

    setIsModalOpen(false);
    setNewProposal({ title: '', description: '', duration: 7, budget: 0 });
  };

  const handleVote = async (proposalId: string, choice: 'approve' | 'reject' | 'abstain') => {
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
    await dataStore.set('proposals', updatedProposals);
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
              <span>Approve: {getVoteCount(proposal, 'approve')} | </span>
              <span>Reject: {getVoteCount(proposal, 'reject')} | </span>
              <span>Abstain: {getVoteCount(proposal, 'abstain')}</span>
            </div>

            {proposal.status === 'active' && (
              <div className="vote-buttons">
                <Button 
                  variant="primary" 
                  onClick={() => handleVote(proposal.id, 'approve')}
                >
                  Approve
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleVote(proposal.id, 'reject')}
                >
                  Reject
                </Button>
                <Button onClick={() => handleVote(proposal.id, 'abstain')}>
                  Abstain
                </Button>
              </div>
            )}
          </Card>
        ))}
        
        {proposals.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <p>No proposals yet</p>
              <p>Create the first proposal to get started</p>
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
          required
        />
        
        <FormInput
          label="Description"
          type="textarea"
          value={newProposal.description}
          onChange={(value) => setNewProposal({...newProposal, description: value as string})}
          required
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
        />

        <div style={{ marginTop: '20px' }}>
          <Button variant="primary" onClick={handleCreateProposal}>
            Create Proposal
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
    console.log('Proposals plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Proposals plugin destroyed');
  }

  getComponent() {
    return ProposalsComponent;
  }
}
