// FILE: src/plugins/CommunicationsPlugin.tsx
// Communications plugin for secure messaging

import React, { useState, useEffect } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';
import { useP2P } from '../contexts/P2PContext';

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'direct' | 'broadcast' | 'announcement';
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system';
}

const CommunicationsComponent: React.FC = () => {
  const { currentUser, dataStore, pluginManager } = useEcosystem();
  const { network, peers, isConnected } = useP2P();
  const [activeTab, setActiveTab] = useState<'messages' | 'chat' | 'announcements'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState({
    subject: '',
    content: ''
  });

  useEffect(() => {
    loadCommunications();
    
    // Listen for new messages from P2P network
    network.on('message', handleIncomingMessage);
    
    // Listen for plugin events
    pluginManager.on('refresh', (tabName: string) => {
      if (tabName === 'communications') {
        loadCommunications();
      }
    });

    return () => {
      network.off('message', handleIncomingMessage);
    };
  }, []);

  const loadCommunications = async () => {
    const savedMessages = await dataStore.get('messages') || [
      {
        id: '1',
        from: 'Jane Doe',
        to: currentUser?.name || 'Demo User',
        subject: 'Welcome to the organization!',
        content: 'Hi! Welcome to our tenant union. Looking forward to working together on improving our building conditions.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        type: 'direct' as const
      },
      {
        id: '2',
        from: 'System',
        to: 'all',
        subject: 'New proposal created',
        content: 'A new proposal "Rent Stabilization Campaign" has been created and is now open for voting.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        type: 'announcement' as const
      }
    ];

    const savedChatMessages = await dataStore.get('chatMessages') || [
      {
        id: '1',
        sender: 'System',
        content: 'Welcome to the organization chat! This is an encrypted group chat for all members.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'system' as const
      },
      {
        id: '2',
        sender: 'Jane Doe',
        content: 'Hey everyone! Don\'t forget about the meeting tonight at 7pm.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'message' as const
      }
    ];

    setMessages(savedMessages);
    setChatMessages(savedChatMessages);
  };

  const handleIncomingMessage = (data: any) => {
    if (data.type === 'chat') {
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: data.sender,
        content: data.content,
        timestamp: new Date().toISOString(),
        type: 'message'
      };
      setChatMessages(prev => [...prev, chatMessage]);
    } else if (data.type === 'direct') {
      const message: Message = {
        id: Date.now().toString(),
        from: data.sender,
        to: currentUser?.name || 'Demo User',
        subject: data.subject,
        content: data.content,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'direct'
      };
      setMessages(prev => [message, ...prev]);
    }
  };

  const handleSendChatMessage = async () => {
    if (!newMessage.trim()) return;

    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: currentUser?.name || 'Demo User',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    // Add to local chat
    setChatMessages(prev => [...prev, chatMessage]);
    
    // Broadcast to P2P network
    network.broadcast({
      type: 'chat',
      sender: currentUser?.name || 'Demo User',
      content: newMessage,
      timestamp: chatMessage.timestamp
    });

    // Save to local storage
    const updatedChatMessages = [...chatMessages, chatMessage];
    await dataStore.set('chatMessages', updatedChatMessages);

    setNewMessage('');
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.subject || !broadcastMessage.content) {
      showNotification('Please fill in both subject and message', 'error');
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      from: currentUser?.name || 'Demo User',
      to: 'all',
      subject: broadcastMessage.subject,
      content: broadcastMessage.content,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'broadcast'
    };

    // Add to local messages
    setMessages(prev => [message, ...prev]);
    
    // Broadcast to P2P network
    network.broadcast({
      type: 'broadcast',
      sender: currentUser?.name || 'Demo User',
      subject: broadcastMessage.subject,
      content: broadcastMessage.content,
      timestamp: message.timestamp
    });

    // Save to local storage
    const updatedMessages = [message, ...messages];
    await dataStore.set('messages', updatedMessages);

    setBroadcastMessage({ subject: '', content: '' });
    showNotification('Broadcast sent to all members', 'success');
  };

  const handleMarkAsRead = async (messageId: string) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    setMessages(updatedMessages);
    await dataStore.set('messages', updatedMessages);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.className = `notification ${type} show`;
      
      setTimeout(() => {
        notification.className = `notification ${type}`;
      }, 3000);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const unreadCount = messages.filter(msg => !msg.read).length;

  return (
    <div>
      {/* Connection Status */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>
            {isConnected 
              ? `Connected to ${peers.length} members - Secure messaging active` 
              : 'Disconnected - Messages will be queued until connection is restored'
            }
          </span>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Button 
          variant={activeTab === 'messages' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('messages')}
        >
          📧 Messages {unreadCount > 0 && `(${unreadCount})`}
        </Button>
        <Button 
          variant={activeTab === 'chat' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('chat')}
        >
          💬 Group Chat
        </Button>
        <Button 
          variant={activeTab === 'announcements' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Broadcast
        </Button>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <Card title="Direct Messages">
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {messages.filter(msg => msg.type === 'direct').map(message => (
              <div 
                key={message.id}
                style={{ 
                  padding: '15px',
                  borderBottom: '1px solid #333',
                  backgroundColor: message.read ? 'transparent' : '#1a2f1a'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>{message.from}</strong>
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    {formatDate(message.timestamp)} {formatTime(message.timestamp)}
                  </span>
                </div>
                <div style={{ fontWeight: '500', marginBottom: '5px' }}>{message.subject}</div>
                <div style={{ color: '#ccc' }}>{message.content}</div>
                {!message.read && (
                  <div style={{ marginTop: '10px' }}>
                    <Button 
                      size="small" 
                      onClick={() => handleMarkAsRead(message.id)}
                    >
                      Mark as Read
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {messages.filter(msg => msg.type === 'direct').length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                No direct messages yet
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <Card title="Group Chat">
          <div style={{ 
            height: '300px', 
            overflowY: 'auto', 
            border: '1px solid #333', 
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '15px'
          }}>
            {chatMessages.map(msg => (
              <div 
                key={msg.id}
                style={{ 
                  marginBottom: '10px',
                  padding: '8px',
                  backgroundColor: msg.type === 'system' ? '#2a2a2a' : 'transparent',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ color: msg.type === 'system' ? '#888' : '#4CAF50' }}>
                    {msg.sender}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div style={{ marginTop: '4px' }}>{msg.content}</div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #444',
                borderRadius: '4px',
                background: '#2a2a2a',
                color: '#e0e0e0'
              }}
              disabled={!isConnected}
            />
            <Button 
              variant="primary" 
              onClick={handleSendChatMessage}
              disabled={!isConnected || !newMessage.trim()}
            >
              Send
            </Button>
          </div>
        </Card>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          <Card title="Send Broadcast Message">
            <FormInput
              label="Subject"
              value={broadcastMessage.subject}
              onChange={(value) => setBroadcastMessage({...broadcastMessage, subject: value as string})}
              placeholder="Announcement subject"
            />
            
            <FormInput
              label="Message"
              type="textarea"
              value={broadcastMessage.content}
              onChange={(value) => setBroadcastMessage({...broadcastMessage, content: value as string})}
              placeholder="Your announcement message..."
              rows={4}
            />

            <Button 
              variant="primary" 
              onClick={handleSendBroadcast}
              disabled={!isConnected}
            >
              📢 Send Broadcast
            </Button>
          </Card>

          <Card title="Recent Announcements">
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {messages.filter(msg => msg.type === 'broadcast' || msg.type === 'announcement').map(message => (
                <div 
                  key={message.id}
                  style={{ 
                    padding: '15px',
                    borderBottom: '1px solid #333'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong>{message.from}</strong>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {formatDate(message.timestamp)} {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontWeight: '500', marginBottom: '5px' }}>{message.subject}</div>
                  <div style={{ color: '#ccc' }}>{message.content}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export class CommunicationsPlugin implements Plugin {
  name = 'communications';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Communications plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Communications plugin destroyed');
  }

  getComponent() {
    return CommunicationsComponent;
  }
}
