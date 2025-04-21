import type { Agent } from 'node:http'
import type { GitInfo } from './types'
import { spawnSync } from 'node:child_process'
import { createWriteStream, existsSync, renameSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { relative, resolve } from 'node:path'
import process from 'node:process'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { fetch } from 'node-fetch-native/proxy'

export async function download(
  url: string,
  filePath: string,
  options: { headers?: Record<string, string | undefined> } = {},
): Promise<void> {
  const infoPath = `${filePath}.json`
  const info: { etag?: string } = JSON.parse(
    await readFile(infoPath, 'utf8').catch(() => '{}'),
  )
  const headResponse = await sendFetch(url, {
    method: 'HEAD',
    headers: options.headers,
  }).catch(() => undefined)
  const etag = headResponse?.headers.get('etag')
  if (info.etag === etag && existsSync(filePath)) {
    // Already downloaded
    return
  }
  if (typeof etag === 'string') {
    info.etag = etag
  }

  const response = await sendFetch(url, { headers: options.headers })
  if (response.status >= 400) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    )
  }

  const stream = createWriteStream(filePath)
  await promisify(pipeline)(response.body as any, stream)

  await writeFile(infoPath, JSON.stringify(info), 'utf8')
}

// eslint-disable-next-line regexp/no-misleading-capturing-group
const inputRegex = /^(?<repo>[\w.-]+\/[\w.-]+)(?<subdir>[^#]+)?(?<ref>#[\w./@-]+)?/

export function parseGitURI(input: string): GitInfo {
  const m = input.match(inputRegex)?.groups || {}
  return <GitInfo>{
    repo: m.repo,
    subdir: m.subdir || '/',
    ref: m.ref ? m.ref.slice(1) : 'main',
  }
}

export function debug(...args: unknown[]): void {
  if (process.env.DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('[gitit]', ...args)
  }
}

interface InternalFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string | undefined>
  agent?: Agent
  validateStatus?: boolean
}

export async function sendFetch(
  url: string,
  options: InternalFetchOptions = {},
): Promise<Response> {
  // https://github.com/nodejs/undici/issues/1305
  if (options.headers?.['sec-fetch-mode']) {
    options.mode = options.headers['sec-fetch-mode'] as any
  }

  const res = await fetch(url, {
    ...options,
    headers: normalizeHeaders(options.headers),
  }).catch((error: any) => {
    throw new Error(`Failed to download ${url}: ${error}`, { cause: error })
  })

  if (options.validateStatus && res.status >= 400) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }

  return res
}

export function cacheDirectory(): string {
  const cacheDir = process.env.XDG_CACHE_HOME
    ? resolve(process.env.XDG_CACHE_HOME, 'gitit')
    : resolve(homedir(), '.cache/gitit')

  if (process.platform === 'win32') {
    const windowsCacheDir = resolve(tmpdir(), 'gitit')
    // Migrate cache dir to new location
    // https://github.com/unjs/gitit/pull/182/
    // TODO: remove in next releases
    if (!existsSync(windowsCacheDir) && existsSync(cacheDir)) {
      try {
        renameSync(cacheDir, windowsCacheDir)
      }
      catch {
        // ignore
      }
    }
    return windowsCacheDir
  }

  return cacheDir
}

export function normalizeHeaders(
  headers: Record<string, string | undefined> = {},
): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (!value) {
      continue
    }
    normalized[key.toLowerCase()] = value
  }
  return normalized
}

// -- Experimental --

export function currentShell(): string {
  if (process.env.SHELL) {
    return process.env.SHELL
  }
  if (process.platform === 'win32') {
    return 'cmd.exe'
  }
  return '/bin/bash'
}

export function startShell(cwd: string): void {
  cwd = resolve(cwd)
  const shell = currentShell()
  // eslint-disable-next-line no-console
  console.info(`(experimental) Opening shell in ${relative(process.cwd(), cwd)}...`)
  spawnSync(shell, [], {
    cwd,
    shell: true,
    stdio: 'inherit',
  })
}
