// FILE: src/contexts/EcosystemContext.tsx
// Main context for sharing core system state across the application

import React, { createContext, useContext, ReactNode } from 'react';
import { Organization, Member } from '../App';
import { PluginManager } from '../core/PluginManager';
import { EncryptedDataStore } from '../core/DataStore';
import { GovernanceEngine } from '../core/GovernanceEngine';

interface EcosystemContextType {
  organization: Organization | null;
  currentUser: Member | null;
  pluginManager: PluginManager;
  dataStore: EncryptedDataStore;
  governance: GovernanceEngine;
  updateOrganization: (org: Organization) => void;
}

const EcosystemContext = createContext<EcosystemContextType | undefined>(undefined);

interface EcosystemProviderProps {
  children: ReactNode;
  organization: Organization | null;
  currentUser: Member | null;
  pluginManager: PluginManager;
  dataStore: EncryptedDataStore;
  governance: GovernanceEngine;
  setOrganization: (org: Organization) => void;
}

export const EcosystemProvider: React.FC<EcosystemProviderProps> = ({
  children,
  organization,
  currentUser,
  pluginManager,
  dataStore,
  governance,
  setOrganization
}) => {
  const updateOrganization = (org: Organization) => {
    setOrganization(org);
    console.log('Updating organization:', org);
  };  

  const value: EcosystemContextType = {
    organization,
    currentUser,
    pluginManager,
    dataStore,
    governance,
    updateOrganization
  };

  return (
    <EcosystemContext.Provider value={value}>
      {children}
    </EcosystemContext.Provider>
  );
};

export const useEcosystem = (): EcosystemContextType => {
  const context = useContext(EcosystemContext);
  if (!context) {
    throw new Error('useEcosystem must be used within an EcosystemProvider');
  }
  return context;
};
