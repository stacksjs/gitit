import type { ParsedTarFileItem } from 'nanotar'
import type { DownloadTemplateOptions, DownloadTemplateResult, ExtractOptions as GitItExtractOptions, Hooks, InstallOptions, TemplateProvider } from './types'
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { gunzipSync } from 'node:zlib'
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
  debug(`Installing dependencies in ${options.cwd}`)

  // Detect package manager based on lock files
  let packageManager = 'npm'
  const installCommand = 'install'

  if (existsSync(resolve(options.cwd, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm'
  }
  else if (existsSync(resolve(options.cwd, 'yarn.lock'))) {
    packageManager = 'yarn'
  }
  else if (existsSync(resolve(options.cwd, 'bun.lockb'))) {
    packageManager = 'bun'
  }

  debug(`Detected package manager: ${packageManager}`)

  // Execute the install command
  const child = spawn(packageManager, [installCommand], {
    cwd: options.cwd,
    stdio: options.silent ? 'ignore' : 'inherit',
    shell: true,
  })

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        debug(`Dependencies installed successfully using ${packageManager}`)
        resolve()
      }
      else {
        reject(new Error(`${packageManager} ${installCommand} exited with code ${code}`))
      }
    })
    child.on('error', (err) => {
      reject(new Error(`Failed to run ${packageManager} ${installCommand}: ${err.message}`))
    })
  })
}

/**
 * Extract a tarball using nanotar (cross-platform)
 */
async function extractTar(options: GitItExtractOptions): Promise<void> {
  const { file, cwd, onentry } = options

  debug(`Extracting tarball ${file} to ${cwd}`)

  try {
    // Read the tar file
    const tarData = await readFile(file)

    // Determine if it's gzipped
    const isGzipped = file.endsWith('.gz') || file.endsWith('.tgz')

    // Process the tar data
    let tarBuffer: Uint8Array
    if (isGzipped) {
      debug('Decompressing gzipped tarball using zlib')
      tarBuffer = gunzipSync(tarData)
    }
    else {
      tarBuffer = tarData
    }

    // Parse the tar file
    const entries = parseTar(tarBuffer)
    debug(`Parsed ${entries.length} entries from tarball`)

    // Identify the root directory to strip
    let rootDir: string | null = null
    for (const entry of entries) {
      if (entry.type === 'directory' && !rootDir && entry.name.indexOf('/') === entry.name.length - 1) {
        rootDir = entry.name.slice(0, -1) // Remove trailing slash
        debug(`Identified root directory to strip: ${rootDir}`)
        break
      }
    }

    // Process entries
    for (const entry of entries) {
      let targetPath = entry.name

      // Apply onentry function if provided (for custom subdir handling)
      if (typeof onentry === 'function') {
        const entryForHook = { path: targetPath }
        onentry(entryForHook)
        targetPath = entryForHook.path

        // Skip entries filtered out by onentry
        if (!targetPath) {
          debug(`Skipping ${entry.name} (filtered by onentry)`)
          continue
        }
      }
      // Default behavior: strip root directory (equivalent to tar --strip-components=1)
      else if (rootDir && targetPath.startsWith(`${rootDir}/`)) {
        targetPath = targetPath.slice(rootDir.length + 1)
        if (!targetPath) {
          debug(`Skipping ${entry.name} (root directory)`)
          continue
        }
      }

      const fullPath = join(cwd, targetPath)

      if (entry.type === 'directory') {
        debug(`Creating directory: ${fullPath}`)
        await mkdir(fullPath, { recursive: true })
      }
      else if (entry.type === 'file' && entry.data) {
        debug(`Writing file: ${fullPath} (${entry.size} bytes)`)
        // Ensure parent directory exists
        await mkdir(dirname(fullPath), { recursive: true })
        await writeFile(fullPath, entry.data)
      }
      else {
        debug(`Skipping unsupported entry type: ${entry.type} for ${entry.name}`)
      }
    }

    debug(`Successfully extracted ${entries.length} entries to ${cwd}`)
  }
  catch (error) {
    throw new Error(`Failed to extract tarball: ${error instanceof Error ? error.message : String(error)}`)
  }
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

  await extractTar(extractOptions)

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
