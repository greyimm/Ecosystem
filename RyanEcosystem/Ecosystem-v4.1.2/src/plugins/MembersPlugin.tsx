// FILE: src/plugins/MembersPlugin.tsx
// Members plugin for member management

import React from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { useEcosystem } from '../contexts/EcosystemContext';
import { useP2P } from '../contexts/P2PContext';

const MembersComponent: React.FC = () => {
  const { organization, currentUser } = useEcosystem();
  const { peers } = useP2P();

  const mockMembers = [
    { id: '1', name: 'Demo User', role: 'admin', status: 'online' },
    { id: '2', name: 'Jane Doe', role: 'member', status: 'online' },
    { id: '3', name: 'John Smith', role: 'member', status: 'offline' },
    { id: '4', name: 'Alice Johnson', role: 'moderator', status: 'online' }
  ];

  return (
    <div>
      <Card 
        title="Organization Members"
        actions={<Button variant="primary">Invite Member</Button>}
      >
        <div className="member-list">
          {mockMembers.map(member => (
            <div key={member.id} className="member-item">
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-meta">
                  {member.role} • {member.status}
                </div>
              </div>
              <div className="member-actions">
                {member.status === 'online' && (
                  <div className="status-indicator online"></div>
                )}
                <Button size="small">Message</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export class MembersPlugin implements Plugin {
  name = 'members';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Members plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Members plugin destroyed');
  }

  getComponent() {
    return MembersComponent;
  }
}