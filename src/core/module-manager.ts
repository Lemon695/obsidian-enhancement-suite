import type { PluginModule } from './types';
import type EnhancementSuitePlugin from '../main';

/**
 * ModuleManager is the central registry for all feature modules.
 *
 * Responsibilities:
 *   - Register modules before the plugin finishes loading
 *   - Load all enabled modules on startup
 *   - Unload all loaded modules on plugin unload
 *   - Enable / disable individual modules at runtime (toggled from settings)
 *
 * The main plugin class delegates ALL module lifecycle to this manager.
 * It knows nothing about individual modules.
 */
export class ModuleManager {
	/** All registered modules, keyed by module ID. */
	private readonly registry: Map<string, PluginModule> = new Map();

	/** IDs of modules that have been successfully loaded. */
	private readonly loaded: Set<string> = new Set();

	constructor(private readonly plugin: EnhancementSuitePlugin) {}

	// ---------------------------------------------------------------------------
	// Registration
	// ---------------------------------------------------------------------------

	/**
	 * Register a module. Must be called before loadAll().
	 * Throws if a module with the same ID is already registered.
	 */
	register(module: PluginModule): void {
		if (this.registry.has(module.id)) {
			throw new Error(
				`[enhancement-suite] Module '${module.id}' is already registered.`
			);
		}
		this.registry.set(module.id, module);
	}

	// ---------------------------------------------------------------------------
	// Bulk lifecycle (called by the plugin's onload / onunload)
	// ---------------------------------------------------------------------------

	/** Load all registered modules that are currently enabled in settings. */
	async loadAll(): Promise<void> {
		for (const [id, module] of this.registry) {
			if (this.isEnabled(id)) {
				await this.loadModule(module);
			}
		}
	}

	/** Unload all currently loaded modules. Called when the plugin unloads. */
	unloadAll(): void {
		// Iterate over a copy so we can mutate this.loaded during iteration.
		for (const id of [...this.loaded]) {
			this.unloadModule(id);
		}
	}

	// ---------------------------------------------------------------------------
	// Runtime enable / disable (called from the settings tab toggles)
	// ---------------------------------------------------------------------------

	/**
	 * Enable a module: persist the change, then load the module if not already loaded.
	 */
	async enableModule(id: string): Promise<void> {
		const module = this.registry.get(id);
		if (!module) return;

		this.plugin.settings.moduleEnabled[id] = true;
		await this.plugin.saveSettings();

		if (!this.loaded.has(id)) {
			await this.loadModule(module);
		}
	}

	/**
	 * Disable a module: persist the change, then unload the module.
	 */
	async disableModule(id: string): Promise<void> {
		this.plugin.settings.moduleEnabled[id] = false;
		await this.plugin.saveSettings();
		this.unloadModule(id);
	}

	// ---------------------------------------------------------------------------
	// Queries (used by the settings tab to render the UI)
	// ---------------------------------------------------------------------------

	/** Returns all registered modules in registration order. */
	getAll(): PluginModule[] {
		return [...this.registry.values()];
	}

	/** Returns a module by ID, or undefined if not registered. */
	get(id: string): PluginModule | undefined {
		return this.registry.get(id);
	}

	/**
	 * Whether a module is enabled in settings.
	 * Defaults to true for any key not explicitly set to false.
	 */
	isEnabled(id: string): boolean {
		const value = this.plugin.settings.moduleEnabled[id];
		// undefined means the key was never set → treat as enabled (opt-out model)
		return value !== false;
	}

	/** Whether a module has been successfully loaded. */
	isLoaded(id: string): boolean {
		return this.loaded.has(id);
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	private async loadModule(module: PluginModule): Promise<void> {
		try {
			await module.onload();
			this.loaded.add(module.id);
			console.debug(`[enhancement-suite] Loaded module: ${module.id}`);
		} catch (e) {
			console.error(
				`[enhancement-suite] Failed to load module '${module.id}':`,
				e
			);
		}
	}

	private unloadModule(id: string): void {
		const module = this.registry.get(id);
		if (!module || !this.loaded.has(id)) return;

		try {
			module.onunload();
			this.loaded.delete(id);
			console.debug(`[enhancement-suite] Unloaded module: ${id}`);
		} catch (e) {
			console.error(
				`[enhancement-suite] Failed to unload module '${id}':`,
				e
			);
		}
	}
}
