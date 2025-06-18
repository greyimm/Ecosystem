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

  // Original loadDefaultPlugins function
  async loadDefaultPlugins(): Promise<void> {
    try {
      // Load core union plugins
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

      console.log('Default plugins loaded successfully');
    } catch (error) {
      console.error('Failed to load default plugins:', error);
    }
  }

  // Original registerPlugin function with error handling
  async registerPlugin(plugin: Plugin): Promise<void> {
    try {
      await plugin.init();
      this.plugins.set(plugin.name, plugin);
      this.emit('pluginRegistered', plugin);
      console.log(`Plugin registered: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error);
    }
  }

  // Original unregisterPlugin function with error handling
  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      try {
        await plugin.destroy();
        this.plugins.delete(name);
        this.emit('pluginUnregistered', plugin);
        console.log(`Plugin unregistered: ${name}`);
      } catch (error) {
        console.error(`Failed to unregister plugin ${name}:`, error);
      }
    }
  }

  // Original getPlugin function
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  // Original getAllPlugins function
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // Original on function
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  // Remove specific listener
  off(event: string, listener?: Function): void {
    if (!this.eventListeners.has(event)) return;
    
    if (listener) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      // Remove all listeners for the event
      this.eventListeners.delete(event);
    }
  }

  // Original emit function with error catching
  emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get event listener count for debugging
  getListenerCount(event: string): number {
    const listeners = this.eventListeners.get(event);
    return listeners ? listeners.length : 0;
  }

  // List all registered events
  getRegisteredEvents(): string[] {
    return Array.from(this.eventListeners.keys());
  }
}