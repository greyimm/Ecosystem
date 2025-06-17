// FILE: src/plugins/DashboardPlugin.tsx
// Dashboard plugin showing organization overview and metrics

import React, { useState, useEffect } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { useEcosystem } from '../contexts/EcosystemContext';
import { useP2P } from '../contexts/P2PContext';
import { RefreshAnimation } from '../components/Common/RefreshAnimation';

interface ActivityItem {
  id: string;
  type: 'proposal' | 'issue' | 'member' | 'vote' | 'message';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

const DashboardComponent: React.FC = () => {
  const { organization, dataStore, pluginManager } = useEcosystem();
  const { peers, isConnected } = useP2P();
  const [metrics, setMetrics] = useState({
    activeMembers: 0,
    onlineMembers: 0,
    openIssues: 0,
    highPriorityIssues: 0,
    activeProposals: 0,
    closingSoonProposals: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Listen for refresh events
    pluginManager.on('refresh', (tabName: string) => {
      if (tabName === 'dashboard') {
        loadDashboardData();
      }
    });

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Load data from different plugins
      const [members, issues, proposals, messages] = await Promise.all([
        dataStore.get('members') || [],
        dataStore.get('issues') || [],
        dataStore.get('proposals') || [],
        dataStore.get('messages') || []
      ]);

      // Calculate metrics
      const activeMembersCount = members.length;
      const onlineMembersCount = peers.length;
      const openIssuesCount = issues.filter((issue: any) => issue.status === 'open').length;
      const highPriorityIssuesCount = issues.filter((issue: any) => 
        issue.status === 'open' && issue.priority === 'high'
      ).length;
      const activeProposalsCount = proposals.filter((proposal: any) => 
        proposal.status === 'active'
      ).length;
      const closingSoonProposalsCount = proposals.filter((proposal: any) => {
        if (proposal.status !== 'active') return false;
        const deadline = new Date(proposal.votingDeadline);
        const now = new Date();
        const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
      }).length;

      setMetrics({
        activeMembers: activeMembersCount,
        onlineMembers: onlineMembersCount,
        openIssues: openIssuesCount,
        highPriorityIssues: highPriorityIssuesCount,
        activeProposals: activeProposalsCount,
        closingSoonProposals: closingSoonProposalsCount
      });

      // Generate recent activity
      const activity: ActivityItem[] = [];
      
      // Add recent proposals
      proposals.slice(0, 3).forEach((proposal: any) => {
        activity.push({
          id: `proposal-${proposal.id}`,
          type: 'proposal',
          title: 'New proposal created',
          description: `"${proposal.title}" by ${proposal.author}`,
          timestamp: proposal.created,
          user: proposal.author
        });
      });

      // Add recent issues
      issues.slice(0, 2).forEach((issue: any) => {
        activity.push({
          id: `issue-${issue.id}`,
          type: 'issue',
          title: 'Issue reported',
          description: `"${issue.title}" - ${issue.priority} priority`,
          timestamp: issue.created,
          user: issue.reporter
        });
      });

      // Add recent messages
      messages.slice(0, 2).forEach((message: any) => {
        if (message.type === 'broadcast') {
          activity.push({
            id: `message-${message.id}`,
            type: 'message',
            title: 'Announcement sent',
            description: `"${message.subject}" by ${message.from}`,
            timestamp: message.timestamp,
            user: message.from
          });
        }
      });

      // Sort by timestamp and take most recent
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 8));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNetworkHealthStatus = () => {
    if (!isConnected) return { status: 'Poor', color: '#f44336' };
    if (peers.length === 0) return { status: 'Disconnected', color: '#ff9800' };
    if (peers.length < 3) return { status: 'Fair', color: '#ff9800' };
    return { status: 'Good', color: '#4CAF50' };
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'proposal': return '📋';
      case 'issue': return '⚠️';
      case 'member': return '👥';
      case 'vote': return '🗳️';
      case 'message': return '📢';
      default: return '📄';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'newProposal':
        pluginManager.emit('openModal', { type: 'newProposal' });
        break;
      case 'reportIssue':
        pluginManager.emit('openModal', { type: 'newIssue' });
        break;
      case 'inviteMember':
        pluginManager.emit('openModal', { type: 'inviteMember' });
        break;
      default:
        console.log('Unknown quick action:', action);
    }
  };

  const networkHealth = getNetworkHealthStatus();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-grid">
        <Card title="Active Members">
          <div className="card-value">{metrics.activeMembers}</div>
          <div className="card-meta">{metrics.onlineMembers} online now</div>
        </Card>
        
        <Card title="Open Issues">
          <div className="card-value">{metrics.openIssues}</div>
          <div className="card-meta">
            {metrics.highPriorityIssues > 0 
              ? `${metrics.highPriorityIssues} high priority` 
              : 'No high priority issues'
            }
          </div>
        </Card>
        
        <Card title="Active Proposals">
          <div className="card-value">{metrics.activeProposals}</div>
          <div className="card-meta">
            {metrics.closingSoonProposals > 0 
              ? `${metrics.closingSoonProposals} closing soon` 
              : 'No urgent deadlines'
            }
          </div>
        </Card>
        
        <Card title="Network Health">
          <div className="card-value" style={{ color: networkHealth.color }}>
            {networkHealth.status}
          </div>
          <div className="card-meta">
            {isConnected ? `Connected to ${peers.length} peers` : 'Connection issues'}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => handleQuickAction('newProposal')}>
            📋 Create Proposal
          </Button>
          <Button variant="secondary" onClick={() => handleQuickAction('reportIssue')}>
            ⚠️ Report Issue
          </Button>
          <Button variant="secondary" onClick={() => handleQuickAction('inviteMember')}>
            👥 Invite Member
          </Button>
          <RefreshAnimation
            onRefresh={loadDashboardData}
            className="secondary"
          >
            🔄 Refresh Data
          </RefreshAnimation>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        {recentActivity.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {recentActivity.map(activity => (
              <div 
                key={activity.id}
                style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #333'
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>
                  {getActivityIcon(activity.type)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {activity.title}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '4px' }}>
                    {activity.description}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {activity.user} • {formatTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <p>No recent activity</p>
            <p>Start by creating a proposal or reporting an issue</p>
          </div>
        )}
      </Card>

      {/* Organization Health Summary */}
      <Card title="Organization Health">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4CAF50' }}>
              {((metrics.onlineMembers / Math.max(metrics.activeMembers, 1)) * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Member Engagement</div>
          </div>
          
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: metrics.highPriorityIssues > 0 ? '#f44336' : '#4CAF50' }}>
              {metrics.highPriorityIssues === 0 ? 'Stable' : 'Attention Needed'}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Issue Status</div>
          </div>
          
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: metrics.activeProposals > 0 ? '#4CAF50' : '#888' }}>
              {metrics.activeProposals > 0 ? 'Active' : 'Quiet'}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Democratic Activity</div>
          </div>
          
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: networkHealth.color }}>
              {isConnected ? 'Secure' : 'Offline'}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Network Security</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export class DashboardPlugin implements Plugin {
  name = 'dashboard';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Dashboard plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Dashboard plugin destroyed');
  }

  getComponent() {
    return DashboardComponent;
  }
}