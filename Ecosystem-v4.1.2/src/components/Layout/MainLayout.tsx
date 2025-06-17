// FILE: src/components/Layout/MainLayout.tsx
// Main application layout with sidebar and content area

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ContentArea } from './ContentArea';
import { useEcosystem } from '../../contexts/EcosystemContext';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { organization } = useEcosystem();

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!organization) {
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
      />
      <div className="main-content">
        <TopBar activeTab={activeTab} onToggleSidebar={toggleSidebar} />
        <ContentArea activeTab={activeTab} />
      </div>
    </div>
  );
};