import type { DownloadTemplateOptions, DownloadTemplateResult, ExtractOptions as GitItExtractOptions, Hooks, InstallOptions, TemplateProvider } from './types'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import defu from 'defu'
import { parseTar } from 'nanotar'
import { providers } from './providers'
import { registryProvider } from './registry'
import { cacheDirectory, debug, download, normalizeHeaders } from './utils'

// eslint-disable-next-line regexp/strict
const sourceProtoRe = /^([\w-.]+):/

/**
 * Install dependencies for a template
 */
async function installDependencies(options: InstallOptions): Promise<void> {
  // Implementation needed here
  // This is a placeholder for now
  debug(`Installing dependencies in ${options.cwd}`)
}

/**
 * Load hooks from config and plugins
 */
function loadHooks(options: DownloadTemplateOptions = {}): Hooks {
  const hooks: Hooks = {}

  // Merge hooks from plugins
  if ('plugins' in options && Array.isArray(options.plugins)) {
    for (const pluginItem of options.plugins) {
      const [plugin, _pluginOptions] = Array.isArray(pluginItem)
        ? pluginItem
        : [pluginItem, {}]

      if (plugin.hooks) {
        for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
          if (typeof hookFn === 'function') {
            hooks[hookName as keyof Hooks] = hookFn as any
          }
        }
      }
    }
  }

  // Config hooks have higher priority
  if (options.hooks) {
    for (const [hookName, hookFn] of Object.entries(options.hooks)) {
      hooks[hookName as keyof Hooks] = hookFn
    }
  }

  return hooks
}

/**
 * Load providers from config and plugins
 */
function loadProviders(options: DownloadTemplateOptions = {}): Record<string, TemplateProvider> {
  const customProviders: Record<string, TemplateProvider> = { ...providers }

  // Add providers from plugins
  if ('plugins' in options && Array.isArray(options.plugins)) {
    for (const pluginItem of options.plugins) {
      const [plugin, _pluginOptions] = Array.isArray(pluginItem)
        ? pluginItem
        : [pluginItem, {}]

      if (plugin.providers) {
        for (const [providerName, providerFn] of Object.entries(plugin.providers)) {
          if (typeof providerFn === 'function') {
            customProviders[providerName] = providerFn as TemplateProvider
          }
        }
      }
    }
  }

  // Config providers have higher priority
  if (options.providers) {
    Object.assign(customProviders, options.providers)
  }

  return customProviders
}

export async function downloadTemplate(
  input: string,
  options: DownloadTemplateOptions = {},
): Promise<DownloadTemplateResult> {
  options = defu(
    {
      registry: process.env.GITIT_REGISTRY,
      auth: process.env.GITIT_AUTH,
    },
    options,
  ) as DownloadTemplateOptions

  // Load hooks
  const hooks = loadHooks(options)

  // Load providers
  const customProviders = loadProviders(options)
  options.providers = customProviders

  // Call beforeDownload hook
  if (hooks.beforeDownload) {
    const hookResult = await Promise.resolve(hooks.beforeDownload(input, options))
    input = hookResult.template
    options = hookResult.options
  }

  const registry
    = options.registry === false
      ? undefined
      : registryProvider(options.registry, { auth: options.auth })

  let providerName: string
    = options.provider || (registry ? 'registry' : 'github')

  let source: string = input
  const sourceProviderMatch = input.match(sourceProtoRe)
  if (sourceProviderMatch) {
    providerName = sourceProviderMatch[1]!
    source = input.slice(sourceProviderMatch[0].length)
    if (providerName === 'http' || providerName === 'https') {
      source = input
    }
  }

  const provider = options.providers?.[providerName] || providers[providerName] || registry
  if (!provider) {
    throw new Error(`Unsupported provider: ${providerName}`)
  }
  const template = await Promise.resolve()
    .then(() => provider(source, { auth: options.auth }))
    .catch((error) => {
      throw new Error(
        `Failed to download template from ${providerName}: ${error.message}`,
      )
    })

  if (!template) {
    throw new Error(`Failed to resolve template from ${providerName}`)
  }

  // Sanitize name and defaultDir
  template.name = (template.name || 'template').replace(/[^\da-z-]/gi, '-')
  template.defaultDir = (template.defaultDir || template.name).replace(
    /[^\da-z-]/gi,
    '-',
  )

  // Download template source
  const temporaryDirectory = resolve(
    cacheDirectory(),
    providerName,
    template.name,
  )
  const tarPath = resolve(
    temporaryDirectory,
    `${template.version || template.name}.tar.gz`,
  )

  if (options.preferOffline && existsSync(tarPath)) {
    options.offline = true
  }
  if (!options.offline) {
    await mkdir(dirname(tarPath), { recursive: true })
    const s = Date.now()
    await download(template.tar, tarPath, {
      headers: {
        Authorization: options.auth ? `Bearer ${options.auth}` : undefined,
        ...normalizeHeaders(template.headers),
      },
    }).catch((error) => {
      if (!existsSync(tarPath)) {
        throw error
      }
      // Accept network errors if we have a cached version
      debug('Download error. Using cached version:', error)
      options.offline = true
    })
    debug(`Downloaded ${template.tar} to ${tarPath} in ${Date.now() - s}ms`)
  }

  if (!existsSync(tarPath)) {
    throw new Error(
      `Tarball not found: ${tarPath} (offline: ${options.offline})`,
    )
  }

  // Create result object
  let result: DownloadTemplateResult = {
    ...template,
    source,
    dir: '',
  }

  // Call afterDownload hook
  if (hooks.afterDownload) {
    result = await Promise.resolve(hooks.afterDownload(result))
  }

  // Extract template
  const cwd = resolve(options.cwd || '.')
  const extractPath = resolve(cwd, options.dir || template.defaultDir)
  if (options.forceClean) {
    await rm(extractPath, { recursive: true, force: true })
  }
  if (
    !options.force
    && existsSync(extractPath)
    && readdirSync(extractPath).length > 0
  ) {
    throw new Error(`Destination ${extractPath} already exists.`)
  }
  await mkdir(extractPath, { recursive: true })

  const s = Date.now()
  const subdir = template.subdir?.replace(/^\//, '') || ''

  // Prepare extract options
  let extractOptions: GitItExtractOptions = {
    file: tarPath,
    cwd: extractPath,
    onentry(entry) {
      entry.path = entry.path.split('/').splice(1).join('/')
      if (subdir) {
        if (entry.path.startsWith(`${subdir}/`)) {
          // Rewrite path
          entry.path = entry.path.slice(subdir.length)
        }
        else {
          // Skip
          entry.path = ''
        }
      }
    },
  }

  // Set result dir
  result.dir = extractPath

  // Call beforeExtract hook
  if (hooks.beforeExtract) {
    const hookResult = await Promise.resolve(hooks.beforeExtract(result, extractOptions))
    result = hookResult.result
    extractOptions = hookResult.extractOptions
  }

  // Extract the template using nanotar
  // Read the file into memory
  const fs = await import('node:fs/promises')
  const tarData = await fs.readFile(extractOptions.file)

  // Parse and extract the tar file
  const entries = parseTar(tarData, {
    filter: (entry) => {
      // Create a compatible object for the onentry function
      const entryForHook = { path: entry.name }

      if (typeof extractOptions.onentry === 'function') {
        extractOptions.onentry(entryForHook)
      }

      // Skip entries with empty paths (filtered out by onentry)
      return entryForHook.path !== ''
    },
  })

  // Write the files to disk
  for (const entry of entries) {
    if (entry.type === 'directory') {
      const dirPath = resolve(extractOptions.cwd, entry.name)
      await fs.mkdir(dirPath, { recursive: true })
    }
    else if (entry.type === 'file') {
      const filePath = resolve(extractOptions.cwd, entry.name)
      // Ensure parent directory exists
      await fs.mkdir(dirname(filePath), { recursive: true })
      // Make sure we have data before writing
      if (entry.data) {
        await fs.writeFile(filePath, entry.data)
      }
    }
    // We could handle other types like symlinks if needed
  }

  debug(`Extracted to ${extractPath} in ${Date.now() - s}ms`)

  // Call afterExtract hook
  if (hooks.afterExtract) {
    result = await Promise.resolve(hooks.afterExtract(result))
  }

  if (options.install) {
    debug('Installing dependencies...')

    // Prepare install options
    let installOptions: InstallOptions = {
      cwd: extractPath,
      silent: options.silent,
    }

    // Call beforeInstall hook
    if (hooks.beforeInstall) {
      const hookResult = await Promise.resolve(hooks.beforeInstall(result, installOptions))
      result = hookResult.result
      installOptions = hookResult.installOptions
    }

    // Install dependencies
    await installDependencies(installOptions)

    // Call afterInstall hook
    if (hooks.afterInstall) {
      result = await Promise.resolve(hooks.afterInstall(result))
    }
  }

  return result
}
