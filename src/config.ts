import type { GitItConfig, GitItPlugin, Hooks } from './types'
import process from 'node:process'
import { loadConfig } from 'bunfig'

export const defaultConfig: GitItConfig = {
  verbose: true,
  dir: './',
  force: false,
  forceClean: false,
  shell: false,
  install: true,
  command: '',
  auth: '',
  cwd: process.cwd(),
  offline: false,
  preferOffline: false,
  hooks: {},
  plugins: [],
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: GitItConfig = await loadConfig({
  name: 'gitit',
  defaultConfig,
})

/**
 * Load and register plugins from a configuration file
 * @param plugins Array of plugins or plugin tuples with options
 * @returns Combined hooks from all plugins
 */
export function loadPlugins(
  plugins: (GitItPlugin | [GitItPlugin, Record<string, any>])[] = [],
): { hooks: Hooks, providers: Record<string, any> } {
  const hooks: Hooks = {}
  const providers: Record<string, any> = {}

  for (const pluginEntry of plugins) {
    const [plugin, _options] = Array.isArray(pluginEntry)
      ? pluginEntry
      : [pluginEntry, {}]

    // Register plugin hooks
    if (plugin.hooks) {
      for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
        hooks[hookName as keyof Hooks] = hookFn
      }
    }

    // Register plugin providers
    if (plugin.providers) {
      for (const [providerName, providerFn] of Object.entries(plugin.providers)) {
        providers[providerName] = providerFn
      }
    }
  }

  return { hooks, providers }
}
