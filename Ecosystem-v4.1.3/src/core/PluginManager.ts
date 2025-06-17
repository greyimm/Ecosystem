// FILE: src/core/PluginManager.ts
// Plugin system for extensible features

export interface Plugin {
  name: string;
  version: string;
  init(): Promise<void>;
  destroy(): Promise<void>;
  getComponent(): React.ComponentType<any>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  async loadDefaultPlugins(): Promise<void> {
    // Load core plugins
    const { DashboardPlugin } = await import('../plugins/DashboardPlugin');
    const { ProposalsPlugin } = await import('../plugins/ProposalsPlugin');
    const { IssuesPlugin } = await import('../plugins/IssuesPlugin');
    const { CommunicationsPlugin } = await import('../plugins/CommunicationsPlugin');
    const { MembersPlugin } = await import('../plugins/MembersPlugin');
    const { SettingsPlugin } = await import('../plugins/SettingsPlugin');

    await this.registerPlugin(new DashboardPlugin());
    await this.registerPlugin(new ProposalsPlugin());
    await this.registerPlugin(new IssuesPlugin());
    await this.registerPlugin(new CommunicationsPlugin());
    await this.registerPlugin(new MembersPlugin());
    await this.registerPlugin(new SettingsPlugin());
  }

  async registerPlugin(plugin: Plugin): Promise<void> {
    await plugin.init();
    this.plugins.set(plugin.name, plugin);
    this.emit('pluginRegistered', plugin);
  }

  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.destroy();
      this.plugins.delete(name);
      this.emit('pluginUnregistered', plugin);
    }
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
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
