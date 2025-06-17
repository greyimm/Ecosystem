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

  async castVote(proposalId: string, voterId: string, choice: 'approve' | 'reject' | 'abstain'): Promise<Vote> {
    const vote: Vote = {
      proposalId,
      voterId,
      choice,
      timestamp: new Date().toISOString(),
      signature: await this.signVote(proposalId, voterId, choice)
    };
    
    return vote;
  }

  async tallyVotes(proposal: Proposal, settings: OrganizationSettings): Promise<'passed' | 'failed' | 'pending'> {
    const totalVotes = proposal.votes.length;
    const approveVotes = proposal.votes.filter(v => v.choice === 'approve').length;
    
    // Check if voting deadline has passed
    const deadline = new Date(proposal.votingDeadline);
    const now = new Date();
    
    if (now < deadline) {
      return 'pending';
    }
    
    // Apply voting system logic
    switch (settings.votingSystem) {
      case 'fptp':
        return approveVotes > (totalVotes / 2) ? 'passed' : 'failed';
      case 'ranked':
        // Simplified ranked choice implementation
        return approveVotes > (totalVotes / 2) ? 'passed' : 'failed';
      case 'consensus':
        // Require higher threshold for consensus
        return approveVotes > (totalVotes * 0.8) ? 'passed' : 'failed';
      default:
        return 'failed';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async signVote(proposalId: string, voterId: string, choice: string): Promise<string> {
    // In a real implementation, use cryptographic signatures
    return `sig_${proposalId}_${voterId}_${choice}_${Date.now()}`;
  }
}