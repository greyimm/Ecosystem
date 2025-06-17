// FILE: src/plugins/IssuesPlugin.tsx
// Issues plugin for reporting and tracking issues

import React, { useState } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';

const IssuesComponent: React.FC = () => {
  const [issues] = useState([
    {
      id: '1',
      title: 'Heating not working in Building A',
      description: 'Multiple units reporting no heat for 3 days',
      priority: 'high',
      status: 'open',
      reporter: 'Jane Doe',
      created: '2025-01-15'
    },
    {
      id: '2', 
      title: 'Broken elevator',
      description: 'Main elevator stuck between floors 3-4',
      priority: 'medium',
      status: 'in-progress',
      reporter: 'John Smith',
      created: '2025-01-14'
    }
  ]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Button variant="primary">Report New Issue</Button>
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
                {issue.status}
              </span>
              <Button size="small">Update Status</Button>
              <Button size="small">Link to Campaign</Button>
            </div>
          </Card>
        ))}
      </div>
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
