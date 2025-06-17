// FILE: src/core/P2PNetwork.ts
// Peer-to-peer networking implementation

export class P2PNetwork {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialize WebRTC configuration
    this.isInitialized = true;
    console.log('P2P Network initialized');
  }

  async connect(): Promise<void> {
    // In a real implementation, this would:
    // 1. Connect to discovery service or use peer introduction
    // 2. Establish WebRTC connections
    // 3. Set up data channels for communication
    
    // For demo, simulate connection
    setTimeout(() => {
      this.emit('connected');
      this.emit('peersChanged', ['peer1', 'peer2', 'peer3']);
    }, 1000);
  }

  disconnect(): void {
    this.peers.forEach(connection => {
      connection.close();
    });
    this.peers.clear();
    this.dataChannels.clear();
    this.emit('disconnected');
  }

  broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(messageStr);
      }
    });
  }

  sendToPeer(peerId: string, message: any): void {
    const channel = this.dataChannels.get(peerId);
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify(message));
    }
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }
}