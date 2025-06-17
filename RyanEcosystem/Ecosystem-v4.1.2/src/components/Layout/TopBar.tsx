// FILE: src/components/Layout/TopBar.tsx
// Top navigation bar with page title and actions

import React from 'react';

interface TopBarProps {
  activeTab: string;
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onToggleSidebar }) => {
  const getPageTitle = (tab: string) => {
    const titles = {
      dashboard: 'Dashboard',
      proposals: 'Proposals',
      issues: 'Issues',
      communications: 'Communications',
      members: 'Members',
      settings: 'Settings'
    };
    return titles[tab as keyof typeof titles] || 'Ecosystem';
  };

  const getActionButton = (tab: string) => {
    switch (tab) {
      case 'proposals':
        return { text: 'New Proposal', action: 'newProposal' };
      case 'issues':
        return { text: 'Report Issue', action: 'newIssue' };
      case 'members':
        return { text: 'Invite Member', action: 'inviteMember' };
      default:
        return null;
    }
  };

  const actionButton = getActionButton(activeTab);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onToggleSidebar}>
          ☰
        </button>
        <h1>{getPageTitle(activeTab)}</h1>
      </div>
      <div className="topbar-actions">
        <button className="btn">Refresh</button>
        {actionButton && (
          <button className="btn primary">
            {actionButton.text}
          </button>
        )}
      </div>
    </div>
  );
};
