// FILE: src/contexts/P2PContext.tsx
// Context for P2P networking state and operations

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { P2PNetwork } from '../core/P2PNetwork';

interface P2PContextType {
  network: P2PNetwork;
  isConnected: boolean;
  peers: string[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

interface P2PProviderProps {
  children: ReactNode;
  network: P2PNetwork;
}

export const P2PProvider: React.FC<P2PProviderProps> = ({ children, network }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    // Set up network event listeners
    network.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    network.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    network.on('peersChanged', (peerList: string[]) => {
      setPeers(peerList);
    });

    // Start connection
    network.connect();
    setConnectionStatus('connecting');

    return () => {
      network.disconnect();
    };
  }, [network]);

  const value: P2PContextType = {
    network,
    isConnected,
    peers,
    connectionStatus
  };

  return (
    <P2PContext.Provider value={value}>
      {children}
    </P2PContext.Provider>
  );
};

export const useP2P = (): P2PContextType => {
  const context = useContext(P2PContext);
  if (!context) {
    throw new Error('useP2P must be used within a P2PProvider');
  }
  return context;
};