// FILE: src/plugins/DashboardPlugin.tsx
// Dashboard plugin showing organization overview and metrics

import React from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { useEcosystem } from '../contexts/EcosystemContext';
import { useP2P } from '../contexts/P2PContext';

const DashboardComponent: React.FC = () => {
  const { organization } = useEcosystem();
  const { peers, isConnected } = useP2P();

  return (
    <div>
      <div className="dashboard-grid">
        <Card title="Active Members">
          <div className="card-value">{organization?.members.length || 0}</div>
          <div className="card-meta">{peers.length} online now</div>
        </Card>
        
        <Card title="Open Issues">
          <div className="card-value">5</div>
          <div className="card-meta">2 high priority</div>
        </Card>
        
        <Card title="Active Proposals">
          <div className="card-value">3</div>
          <div className="card-meta">1 closing soon</div>
        </Card>
        
        <Card title="Network Health">
          <div className="card-value" style={{ color: isConnected ? '#4CAF50' : '#f44336' }}>
            {isConnected ? 'Good' : 'Poor'}
          </div>
          <div className="card-meta">
            {isConnected ? 'All peers connected' : 'Connection issues'}
          </div>
        </Card>
      </div>

      <Card title="Recent Activity">
        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
          <p>No recent activity</p>
          <p>Start by creating a proposal or reporting an issue</p>
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
