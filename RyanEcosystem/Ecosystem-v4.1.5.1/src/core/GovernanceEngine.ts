// FILE: src/core/GovernanceEngine.ts
// Democratic governance and voting implementation

import { Proposal, Vote, OrganizationSettings } from '../App';

export class GovernanceEngine {
  async createProposal(proposalData: Omit<Proposal, 'id' | 'created' | 'status' | 'votes'>): Promise<Proposal> {
    const proposal: Proposal = {
      ...proposalData,
      id: this.generateId(),
      created: new Date().toISOString(),
      status: 'active',
      votes: []
    };
    
    return proposal;
  }

  async castVote(proposalId: string, voterId: string, choice: 'for' | 'against' | 'abstain'): Promise<Vote> {
    const vote: Vote = {
      id: this.generateId(),
      proposalId,
      voterId,
      vote: choice, // Using 'vote' property to match Vote interface
      timestamp: new Date().toISOString(),
      anonymous: false // Default to non-anonymous for now
    };
    
    return vote;
  }

  async tallyVotes(proposal: Proposal, settings: OrganizationSettings): Promise<'passed' | 'failed' | 'pending'> {
    const totalVotes = proposal.votes.length;
    const forVotes = proposal.votes.filter(v => v.vote === 'for').length;
    
    // Check if voting deadline has passed
    const deadline = new Date(proposal.votingDeadline);
    const now = new Date();
    
    if (now < deadline) {
      return 'pending';
    }
    
    // Apply voting system logic
    switch (settings.votingSystem) {
      case 'fptp':
        return forVotes > (totalVotes / 2) ? 'passed' : 'failed';
      case 'ranked':
        // Simplified ranked choice implementation
        return forVotes > (totalVotes / 2) ? 'passed' : 'failed';
      case 'consensus':
        // Require higher threshold for consensus
        return forVotes > (totalVotes * 0.8) ? 'passed' : 'failed';
      default:
        return 'failed';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}