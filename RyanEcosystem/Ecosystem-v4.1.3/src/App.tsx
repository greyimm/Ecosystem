// FILE: src/App.tsx
// Main application component that sets up the core structure and plugin system

import React, { useState, useEffect } from 'react';
import { EcosystemProvider } from './contexts/EcosystemContext';
import { P2PProvider } from './contexts/P2PContext';
import { MainLayout } from './components/Layout/MainLayout';
import { PluginManager } from './core/PluginManager';
import { P2PNetwork } from './core/P2PNetwork';
import { EncryptedDataStore } from './core/DataStore';
import { GovernanceEngine } from './core/GovernanceEngine';
import './styles/globals.css';

// Core system interfaces
export interface Organization {
  id: string;
  name: string;
  type: 'tenant-union' | 'labor-union' | 'cooperative' | 'general';
  created: string;
  members: Member[];
  settings: OrganizationSettings;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'moderator';
  joinedDate: string;
  publicKey: string;
}

export interface OrganizationSettings {
  votingSystem: 'fptp' | 'ranked' | 'consensus';
  quorumThreshold: number;
  proposalDuration: number;
  allowAnonymousVoting: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  created: string;
  votingDeadline: string;
  status: 'active' | 'passed' | 'failed' | 'pending';
  votes: Vote[];
  budgetRequired?: number;
}

export interface Vote {
  proposalId: string;
  voterId: string;
  choice: 'approve' | 'reject' | 'abstain';
  timestamp: string;
  signature: string;
}

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);

  // Core system instances
  const [pluginManager] = useState(() => new PluginManager());
  const [p2pNetwork] = useState(() => new P2PNetwork());
  const [dataStore] = useState(() => new EncryptedDataStore());
  const [governance] = useState(() => new GovernanceEngine());

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize core systems
      await dataStore.init();
      await p2pNetwork.init();
      
      // Load organization data
      const orgData = await loadOrganization();
      setOrganization(orgData);
      
      // Set up default user (in a real app, this would come from authentication)
      const user: Member = {
        id: generateId(),
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin',
        joinedDate: new Date().toISOString(),
        publicKey: await generatePublicKey()
      };
      setCurrentUser(user);
      
      // Initialize plugin system
      await pluginManager.loadDefaultPlugins();
      
      setIsInitialized(true);
      console.log('Ecosystem App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const loadOrganization = async (): Promise<Organization> => {
    let orgData = await dataStore.get('organization');
    
    if (!orgData) {
      // Create default organization for demo
      orgData = {
        id: generateId(),
        name: 'Tenant Union Local 123',
        type: 'tenant-union',
        created: new Date().toISOString(),
        members: [],
        settings: {
          votingSystem: 'fptp',
          quorumThreshold: 0.5,
          proposalDuration: 7,
          allowAnonymousVoting: true
        }
      };
      
      await dataStore.set('organization', orgData);
    }
    
    return orgData;
  };

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const generatePublicKey = async (): Promise<string> => {
    // In a real implementation, this would generate actual cryptographic keys
    return 'demo-public-key-' + Math.random().toString(36).substr(2, 16);
  };

  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Initializing Ecosystem...</p>
      </div>
    );
  }

  return (
    <EcosystemProvider
      organization={organization}
      currentUser={currentUser}
      pluginManager={pluginManager}
      dataStore={dataStore}
      governance={governance}
      setOrganization={setOrganization}
    >
      <P2PProvider network={p2pNetwork}>
        <MainLayout />
      </P2PProvider>
    </EcosystemProvider>
  );
};

export default App;
