// FILE: src/App.tsx
// Main application component that sets up the core structure and plugin system

import React, { useState, useEffect, useCallback } from 'react';
import { EcosystemProvider } from './contexts/EcosystemContext';
import { P2PProvider } from './contexts/P2PContext';
import { MainLayout } from './components/Layout/MainLayout';
import { PluginManager } from './core/PluginManager';
import { P2PNetwork } from './core/P2PNetwork';
import { EncryptedDataStore } from './core/DataStore';
import { GovernanceEngine } from './core/GovernanceEngine';
// REMOVED: import './styles/globals.css'; - styles now imported in index.tsx

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
  category?: string;
}

export interface Vote {
  id: string;
  proposalId: string;
  voterId: string;
  vote: 'for' | 'against' | 'abstain';
  timestamp: string;
  anonymous: boolean;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  reportedBy: string;
  created: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  objective: string;
  coordinator: string;
  created: string;
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  participants: string[];
  tasks: CampaignTask[];
  budget?: number;
  expenses?: CampaignExpense[];
}

export interface CampaignTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface CampaignExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  approvedBy: string;
  category: string;
}

export interface Message {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  channel: string;
  encrypted: boolean;
  recipients?: string[];
}

// App state management
interface AppState {
  view: 'homepage' | 'union';
  currentUnionId: string | null;
}

const App: React.FC = () => {
  // Core system instances
  const [pluginManager] = useState(() => new PluginManager());
  const [dataStore] = useState(() => new EncryptedDataStore());
  const [governance] = useState(() => new GovernanceEngine());
  const [p2pNetwork] = useState(() => new P2PNetwork());
  
  // Application state
  const [isInitialized, setIsInitialized] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [appState, setAppState] = useState<AppState>({
    view: 'homepage',
    currentUnionId: null
  });

  // Initialize plugin system
  const initializePlugins = useCallback(async () => {
    try {
      await pluginManager.loadDefaultPlugins();
      
      // Load homepage plugin
      const { HomepagePlugin } = await import('./plugins/HomepagePlugin');
      await pluginManager.registerPlugin(new HomepagePlugin());
      
      console.log('All plugins initialized successfully');
    } catch (error) {
      console.error('Failed to initialize plugins:', error);
    }
  }, [pluginManager]);

  // Initialize the application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize core systems that have init methods
        await dataStore.init();
        await p2pNetwork.init();
        await p2pNetwork.init();
        // Note: GovernanceEngine doesn't have an init method
        
        // Initialize plugins
        await initializePlugins();
        
        // Create demo user for development
        const demoUser: Member = {
          id: generateId(),
          name: 'Demo User',
          email: 'demo@ecosystem.local',
          role: 'admin',
          joinedDate: new Date().toISOString(),
          publicKey: await generatePublicKey()
        };
        
        setCurrentUser(demoUser);
        setIsInitialized(true);
        
        console.log('Application initialized successfully');
      } catch (error) {
        console.error('Failed to initialize application:', error);
      }
    };

    initializeApp();
  }, [dataStore, p2pNetwork, initializePlugins]);

  // Listen for union selection events
  useEffect(() => {
    const handleUnionSelection = (data: { unionId: string; organization: Organization }) => {
      console.log('Union selection event received:', data);
      setOrganization(data.organization);
      setAppState({
        view: 'union',
        currentUnionId: data.unionId
      });
    };

    const handleReturnToHomepage = () => {
      console.log('Return to homepage event received');
      setOrganization(null);
      setAppState({
        view: 'homepage',
        currentUnionId: null
      });
    };

    console.log('Setting up event listeners for selectUnion and returnToHomepage');
    pluginManager.on('selectUnion', handleUnionSelection);
    pluginManager.on('returnToHomepage', handleReturnToHomepage);

    return () => {
      console.log('Cleaning up event listeners');
      pluginManager.off('selectUnion', handleUnionSelection);
      pluginManager.off('returnToHomepage', handleReturnToHomepage);
    };
  }, [pluginManager]);

  // Helper functions
  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const generatePublicKey = async (): Promise<string> => {
    // In a real implementation, this would generate actual cryptographic keys
    return 'demo-public-key-' + Math.random().toString(36).substr(2, 16);
  };

  // Extended organization update function
  const extendedUpdateOrganization = (org: Organization) => {
    setOrganization(org);
    console.log('Updating organization:', org);
  };

  // Loading screen while initializing
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
      setOrganization={extendedUpdateOrganization}
    >
      <P2PProvider network={p2pNetwork}>
        <MainLayout 
          appState={appState}
          onReturnToHomepage={() => {
            setOrganization(null);
            setAppState({
              view: 'homepage',
              currentUnionId: null
            });
          }}
        />
      </P2PProvider>
    </EcosystemProvider>
  );
};

export default App;