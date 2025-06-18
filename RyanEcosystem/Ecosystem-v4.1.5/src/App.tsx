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

// Application view state for homepage vs union view
interface AppState {
  view: 'homepage' | 'union';
  currentUnionId: string | null;
}

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  
  // App state management for homepage/union routing
  const [appState, setAppState] = useState<AppState>({
    view: 'homepage',
    currentUnionId: null
  });

  // Core system instances
  const [pluginManager] = useState(() => new PluginManager());
  const [p2pNetwork] = useState(() => new P2PNetwork());
  const [dataStore] = useState(() => new EncryptedDataStore());
  const [governance] = useState(() => new GovernanceEngine());

  useEffect(() => {
    initializeApp();
  }, []);

  // Listen for union selection events
  useEffect(() => {
    const handleUnionSelection = (data: { unionId: string; organization: Organization }) => {
      setOrganization(data.organization);
      setAppState({
        view: 'union',
        currentUnionId: data.unionId
      });
    };

    const handleReturnToHomepage = () => {
      setOrganization(null);
      setAppState({
        view: 'homepage',
        currentUnionId: null
      });
    };

    pluginManager.on('selectUnion', handleUnionSelection);
    pluginManager.on('returnToHomepage', handleReturnToHomepage);

    return () => {
      pluginManager.off('selectUnion', handleUnionSelection);
      pluginManager.off('returnToHomepage', handleReturnToHomepage);
    };
  }, [pluginManager]);

  const initializeApp = async () => {
    try {
      // Initialize core systems
      await dataStore.init();
      await p2pNetwork.init();
      
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
      
      // Check if user was previously in a specific union
      const lastUnionId = await dataStore.get('currentUnionId');
      if (lastUnionId) {
        const lastOrgData = await dataStore.get(`organization_${lastUnionId}`);
        if (lastOrgData) {
          setOrganization(lastOrgData);
          setAppState({
            view: 'union',
            currentUnionId: lastUnionId
          });
        } else {
          // If specific union data doesn't exist, fall back to general org data
          const orgData = await loadOrganization();
          if (orgData) {
            setOrganization(orgData);
            setAppState({
              view: 'union',
              currentUnionId: orgData.id
            });
          }
        }
      } else {
        // Check if there's any organization data to migrate to new system
        const orgData = await loadOrganization();
        if (orgData) {
          // Migrate existing org to new union system
          await migrateToUnionSystem(orgData);
        }
      }
      
      // Initialize plugin system with homepage plugin
      await initializePlugins();
      
      setIsInitialized(true);
      console.log('Ecosystem App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  // Original loadOrganization function
  const loadOrganization = async (): Promise<Organization | null> => {
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

  // Migrate existing organization to union system
  const migrateToUnionSystem = async (orgData: Organization) => {
    try {
      const unionsList = await dataStore.get('unionsList') || [];
      
      // Check if this org is already in the unions list
      const existingUnion = unionsList.find((u: any) => u.id === orgData.id);
      
      if (!existingUnion) {
        // Add to unions list
        const unionSummary = {
          id: orgData.id,
          name: orgData.name,
          type: orgData.type,
          memberCount: orgData.members.length,
          lastActivity: new Date().toISOString(),
          created: orgData.created,
          isActive: true
        };
        
        unionsList.push(unionSummary);
        await dataStore.set('unionsList', unionsList);
        
        // Store organization with union-specific key
        await dataStore.set(`organization_${orgData.id}`, orgData);
        
        console.log('Migrated existing organization to union system');
      }
    } catch (error) {
      console.error('Failed to migrate to union system:', error);
    }
  };

  // Extended plugin initialization to include homepage plugin
  const initializePlugins = async () => {
    try {
      await pluginManager.loadDefaultPlugins();
      
      // Load homepage plugin
      const { HomepagePlugin } = await import('./plugins/HomepagePlugin');
      await pluginManager.registerPlugin(new HomepagePlugin());
      
      console.log('All plugins initialized successfully');
    } catch (error) {
      console.error('Failed to initialize plugins:', error);
    }
  };

  // Original helper functions
  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const generatePublicKey = async (): Promise<string> => {
    // In a real implementation, this would generate actual cryptographic keys
    return 'demo-public-key-' + Math.random().toString(36).substr(2, 16);
  };

  // Extended context provider to include app state
  const extendedUpdateOrganization = (org: Organization) => {
    setOrganization(org);
    console.log('Updating organization:', org);
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