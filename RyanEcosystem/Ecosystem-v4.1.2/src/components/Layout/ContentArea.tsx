// FILE: src/components/Layout/ContentArea.tsx
// Main content area that renders active plugin

import React from 'react';
import { useEcosystem } from '../../contexts/EcosystemContext';

interface ContentAreaProps {
  activeTab: string;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ activeTab }) => {
  const { pluginManager } = useEcosystem();

  const renderPluginContent = () => {
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
