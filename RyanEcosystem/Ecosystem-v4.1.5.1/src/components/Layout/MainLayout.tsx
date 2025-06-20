// FILE: src/components/Layout/MainLayout.tsx
// Main application layout with sidebar and content area

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ContentArea } from './ContentArea';
import { useEcosystem } from '../../contexts/EcosystemContext';

// App state interface
interface AppState {
  view: 'homepage' | 'union';
  currentUnionId: string | null;
}

interface MainLayoutProps {
  appState: AppState;
  onReturnToHomepage: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  appState, 
  onReturnToHomepage 
}) => {
  // Default to homepage tab when on homepage, dashboard when in union
  const [activeTab, setActiveTab] = useState(() => 
    appState.view === 'homepage' ? 'homepage' : 'dashboard'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { organization } = useEcosystem();

  const handleTabChange = (tabName: string) => {
    // Handle special case for returning to homepage
    if (tabName === 'homepage' && appState.view === 'union') {
      onReturnToHomepage();
      return;
    }
    setActiveTab(tabName);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Update active tab when app state changes
  React.useEffect(() => {
    if (appState.view === 'homepage') {
      setActiveTab('homepage');
    } else if (appState.view === 'union' && activeTab === 'homepage') {
      setActiveTab('dashboard');
    }
  }, [appState.view]);

  // Show loading only when we're supposed to be in union view but no organization is loaded
  if (appState.view === 'union' && !organization) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading organization...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        appState={appState}
      />
      <div className="main-content">
        <TopBar 
          activeTab={activeTab} 
          appState={appState}
        />
        <ContentArea 
          activeTab={activeTab}
          appState={appState}
        />
      </div>
    </div>
  );
};