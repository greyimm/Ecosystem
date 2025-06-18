// FILE: src/components/Layout/ContentArea.tsx
// Main content area that renders active plugin

import React from 'react';
import { useEcosystem } from '../../contexts/EcosystemContext';

interface AppState {
  view: 'homepage' | 'union';
  currentUnionId: string | null;
}

interface ContentAreaProps {
  activeTab: string;
  appState: AppState;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ 
  activeTab, 
  appState 
}) => {
  const { pluginManager } = useEcosystem();

  // Homepage rendering component
  const renderPluginContent = () => {
    if (activeTab === 'homepage' || appState.view === 'homepage') {
      const homepagePlugin = pluginManager.getPlugin('homepage');
      if (!homepagePlugin) {
        return (
          <div className="loading">
            <div className="spinner"></div>
            Loading homepage...
          </div>
        );
      }
      
      const HomepageComponent = homepagePlugin.getComponent();
      return <HomepageComponent />;
    }

    const plugin = pluginManager.getPlugin(activeTab);
    if (!plugin) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          Loading {activeTab}...
        </div>
      );
    }

    const PluginComponent = plugin.getComponent();
    return <PluginComponent />;
  };

  return (
    <div className="content-area">
      {renderPluginContent()}
    </div>
  );
};