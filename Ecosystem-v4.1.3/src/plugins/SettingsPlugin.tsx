// FILE: src/plugins/SettingsPlugin.tsx
// Settings plugin for organization configuration

import React, { useState } from 'react';
import { Plugin } from '../core/PluginManager';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { FormInput } from '../components/Common/FormInput';
import { useEcosystem } from '../contexts/EcosystemContext';

const SettingsComponent: React.FC = () => {
const { organization, dataStore, updateOrganization } = useEcosystem();
  const [settings, setSettings] = useState({
    orgName: organization?.name || '',
    orgType: organization?.type || 'tenant-union',
    votingSystem: organization?.settings.votingSystem || 'fptp',
    quorumThreshold: organization?.settings.quorumThreshold || 0.5,
    proposalDuration: organization?.settings.proposalDuration || 7
  });

const handleSaveSettings = async () => {
  if (organization) {
    const updatedOrg = {
      ...organization,
      name: settings.orgName,
      type: settings.orgType as any,
      settings: {
        ...organization.settings,
        votingSystem: settings.votingSystem as any,
        quorumThreshold: settings.quorumThreshold,
        proposalDuration: settings.proposalDuration
      }
    };
    
    await dataStore.set('organization', updatedOrg);
    updateOrganization(updatedOrg);
    
    console.log('Settings saved:', updatedOrg);
  }
};

  const orgTypeOptions = [
    { value: 'tenant-union', label: 'Tenant Union' },
    { value: 'labor-union', label: 'Labor Union' },
    { value: 'cooperative', label: 'Cooperative' },
    { value: 'general', label: 'General Organizing' }
  ];

  const votingSystemOptions = [
    { value: 'fptp', label: 'First Past The Post' },
    { value: 'ranked', label: 'Ranked Choice' },
    { value: 'consensus', label: 'Consensus' }
  ];

  return (
    <div>
      <Card title="Organization Settings">
        <FormInput
          label="Organization Name"
          value={settings.orgName}
          onChange={(value) => setSettings({...settings, orgName: value as string})}
        />
        
        <FormInput
          label="Organization Type"
          type="select"
          value={settings.orgType}
          onChange={(value) => setSettings({...settings, orgType: value as 'tenant-union' | 'labor-union' | 'cooperative' | 'general'})}
          options={orgTypeOptions}
        />
        
        <FormInput
          label="Voting System"
          type="select"
          value={settings.votingSystem}
          onChange={(value) => setSettings({...settings, votingSystem: value as 'fptp' | 'ranked' | 'consensus'})}
          options={votingSystemOptions}
        />
        
        <FormInput
          label="Quorum Threshold"
          type="number"
          value={settings.quorumThreshold}
          onChange={(value) => setSettings({...settings, quorumThreshold: value as number})}
        />
        
        <FormInput
          label="Default Proposal Duration (days)"
          type="number"
          value={settings.proposalDuration}
          onChange={(value) => setSettings({...settings, proposalDuration: value as number})}
        />

        <div style={{ marginTop: '20px' }}>
          <Button variant="primary" onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};

export class SettingsPlugin implements Plugin {
  name = 'settings';
  version = '1.0.0';

  async init(): Promise<void> {
    console.log('Settings plugin initialized');
  }

  async destroy(): Promise<void> {
    console.log('Settings plugin destroyed');
  }

  getComponent() {
    return SettingsComponent;
  }
}