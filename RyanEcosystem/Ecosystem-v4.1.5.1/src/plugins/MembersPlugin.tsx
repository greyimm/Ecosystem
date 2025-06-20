// FILE: src/plugins/MembersPlugin.tsx
// Members plugin for member management - UPDATED with union data change events

import React, { useState, useEffect, useCallback } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';
import { useP2P } from '../contexts/P2PContext';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'moderator';
  status: 'online' | 'offline';
  joinedDate: string;
  lastActive: string;
}

const MembersComponent: React.FC = () => {
  const { organization, currentUser, dataStore, pluginManager } = useEcosystem();
  const { peers } = useP2P();
  const [members, setMembers] = useState<Member[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'member' as 'admin' | 'member' | 'moderator'
  });
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: ''
  });

  /**
   * Load members for the current organization
   * Uses union-specific storage key if we're in a union context
   */
  const loadMembers = useCallback(async () => {
    try {
      // Use union-specific storage key if we have an organization ID
      const storageKey = organization?.id ? `members_${organization.id}` : 'members';
      let savedMembers = await dataStore.get(storageKey);
      
      // If no members exist, create demo data and save it
      if (!savedMembers || savedMembers.length === 0) {
        const demoMembers = [
          { 
            id: '1', 
            name: 'Demo User', 
            email: 'demo@example.com',
            role: 'admin' as const, 
            status: 'online' as const,
            joinedDate: '2025-01-01',
            lastActive: new Date().toISOString()
          },
          { 
            id: '2', 
            name: 'Jane Doe', 
            email: 'jane@example.com',
            role: 'member' as const, 
            status: 'online' as const,
            joinedDate: '2025-01-10',
            lastActive: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          },
          { 
            id: '3', 
            name: 'John Smith', 
            email: 'john@example.com',
            role: 'member' as const, 
            status: 'offline' as const,
            joinedDate: '2025-01-05',
            lastActive: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          { 
            id: '4', 
            name: 'Alice Johnson', 
            email: 'alice@example.com',
            role: 'moderator' as const, 
            status: 'online' as const,
            joinedDate: '2025-01-08',
            lastActive: new Date(Date.now() - 1800000).toISOString() // 30 min ago
          }
        ];
        
        // Save demo data to storage so homepage can find it
        await dataStore.set(storageKey, demoMembers);
        savedMembers = demoMembers;
        
        // Emit union data change event for homepage refresh
        pluginManager.emit('unionDataChanged', {
          type: 'members',
          unionId: organization?.id,
          count: demoMembers.length
        });
        
        console.log('Demo member data initialized and saved to storage');
      }
      
      // Update online status based on P2P connections
      const updatedMembers = savedMembers.map((member: Member) => ({
        ...member,
        status: peers.includes(member.id) ? 'online' as const : 'offline' as const
      }));
      
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }, [organization?.id, dataStore, peers, pluginManager]);

  useEffect(() => {
    loadMembers();
    
    // Listen for plugin events
    const handleOpenModal = (data: any) => {
      if (data.type === 'inviteMember') {
        setIsInviteModalOpen(true);
      }
    };

    const handleRefresh = (tabName: string) => {
      if (tabName === 'members') {
        loadMembers();
      }
    };

    pluginManager.on('openModal', handleOpenModal);
    pluginManager.on('refresh', handleRefresh);

    return () => {
      pluginManager.off('openModal', handleOpenModal);
      pluginManager.off('refresh', handleRefresh);
    };
  }, [loadMembers, pluginManager]);

  /**
   * Save members to storage and emit union data change event
   */
  const saveMembers = async (newMembers: Member[]) => {
    try {
      // Use union-specific storage key if we have an organization ID
      const storageKey = organization?.id ? `members_${organization.id}` : 'members';
      await dataStore.set(storageKey, newMembers);
      
      // Emit event to notify homepage and other components that union data changed
      pluginManager.emit('unionDataChanged', {
        type: 'members',
        unionId: organization?.id,
        count: newMembers.length
      });
      
      console.log('Members saved and union data change event emitted');
    } catch (error) {
      console.error('Failed to save members:', error);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    // Check if email already exists
    if (members.some(member => member.email === inviteForm.email)) {
      showNotification('A member with this email already exists', 'error');
      return;
    }

    const newMember: Member = {
      id: Date.now().toString(),
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'offline',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString()
    };

    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);
    
    // Save members and emit union data change event
    await saveMembers(updatedMembers);

    // In a real implementation, this would send an actual invite email
    setIsInviteModalOpen(false);
    setInviteForm({ name: '', email: '', role: 'member' });
    showNotification(`Invitation sent to ${newMember.name}`, 'success');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === currentUser?.id) {
      showNotification('Cannot remove yourself', 'error');
      return;
    }

    const updatedMembers = members.filter(member => member.id !== memberId);
    setMembers(updatedMembers);
    
    // Save members and emit union data change event
    await saveMembers(updatedMembers);
    
    showNotification('Member removed', 'success');
  };

  const handlePromoteMember = async (memberId: string, newRole: Member['role']) => {
    const updatedMembers = members.map(member => 
      member.id === memberId ? { ...member, role: newRole } : member
    );
    setMembers(updatedMembers);
    
    // Save members and emit union data change event
    await saveMembers(updatedMembers);
    
    showNotification('Member role updated', 'success');
  };

  const handleSendMessage = async () => {
    if (!selectedMember || !messageForm.subject || !messageForm.message) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    // In a real implementation, this would send through the P2P network
    setIsMessageModalOpen(false);
    setSelectedMember(null);
    setMessageForm({ subject: '', message: '' });
    showNotification(`Message sent to ${selectedMember.name}`, 'success');
  };

  const openMessageModal = (member: Member) => {
    setSelectedMember(member);
    setMessageForm({ subject: '', message: '' });
    setIsMessageModalOpen(true);
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

  const roleOptions = [
    { value: 'member', label: 'Member' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastActive = (dateString: string) => {
    const now = new Date();
    const lastActive = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div>
      <Card 
        title={`Organization Members (${members.length})`}
        actions={
          <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
            👥 Invite Member
          </Button>
        }
      >
        <div className="member-list">
          {members.map(member => (
            <div key={member.id} className="member-item">
              <div className="member-info">
                <div className="member-name">
                  {member.name}
                  {member.id === currentUser?.id && ' (You)'}
                </div>
                <div className="member-meta">
                  {member.email} • {member.role} • Joined {formatDate(member.joinedDate)}
                  {member.status === 'online' && ' • Active now'}
                  {member.status === 'offline' && ` • Last seen ${formatLastActive(member.lastActive)}`}
                </div>
              </div>
              <div className="member-actions">
                <div className={`status-indicator ${member.status}`}></div>
                {member.status === 'online' && member.id !== currentUser?.id && (
                  <Button size="small" onClick={() => openMessageModal(member)}>
                    💬 Message
                  </Button>
                )}
                {currentUser?.role === 'admin' && member.id !== currentUser?.id && (
                  <>
                    <select 
                      value={member.role}
                      onChange={(e) => handlePromoteMember(member.id, e.target.value as Member['role'])}
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px', 
                        background: '#2a2a2a', 
                        color: '#e0e0e0',
                        border: '1px solid #444',
                        borderRadius: '4px'
                      }}
                    >
                      {roleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Button 
                      size="small" 
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`Remove ${member.name} from the organization?`)) {
                          handleRemoveMember(member.id);
                        }
                      }}
                    >
                      ❌ Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Member"
      >
        <FormInput
          label="Full Name"
          value={inviteForm.name}
          onChange={(value) => setInviteForm({...inviteForm, name: value as string})}
          placeholder="Enter member's full name"
          required
        />
        
        <FormInput
          label="Email Address"
          type="email"
          value={inviteForm.email}
          onChange={(value) => setInviteForm({...inviteForm, email: value as string})}
          placeholder="Enter member's email address"
          required
        />
        
        <FormInput
          label="Role"
          type="select"
          value={inviteForm.role}
          onChange={(value) => setInviteForm({...inviteForm, role: value as Member['role']})}
          options={roleOptions}
        />

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={handleInviteMember}>
            📧 Send Invitation
          </Button>
          <Button onClick={() => setIsInviteModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={`Message ${selectedMember?.name}`}
      >
        <FormInput
          label="Subject"
          value={messageForm.subject}
          onChange={(value) => setMessageForm({...messageForm, subject: value as string})}
          placeholder="Message subject"
          required
        />
        
        <FormInput
          label="Message"
          type="textarea"
          value={messageForm.message}
          onChange={(value) => setMessageForm({...messageForm, message: value as string})}
          placeholder="Type your message here..."
          rows={5}
          required
        />

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={handleSendMessage}>
            📤 Send Message
          </Button>
          <Button onClick={() => setIsMessageModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export class MembersPlugin implements Plugin {
  name = 'members';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Members plugin initialized with union data change event emission');
  }

  async destroy(): Promise<void> {
    console.log('Members plugin destroyed');
  }

  getComponent() {
    return MembersComponent;
  }
}