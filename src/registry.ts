import type { TemplateInfo, TemplateProvider } from './types'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { debug, sendFetch } from './utils'

// const DEFAULT_REGISTRY = 'https://cdn.jsdelivr.net/gh/unjs/giget/templates'
const DEFAULT_REGISTRY = 'https://raw.githubusercontent.com/unjs/giget/main/templates'

export function registryProvider(registryEndpoint: string = DEFAULT_REGISTRY, options: { auth?: string } = {}) {
  return <TemplateProvider>(async (input) => {
    const start = Date.now()

    // Try to load from local templates directory first
    const localPath = resolve(process.cwd(), 'src/templates', `${input}.json`)
    if (existsSync(localPath)) {
      try {
        const content = await readFile(localPath, 'utf8')
        const info = JSON.parse(content) as TemplateInfo
        if (!info.tar || !info.name) {
          throw new Error(
            `Invalid template info from ${localPath}. name or tar fields are missing!`,
          )
        }
        debug(`Loaded ${input} template info from local path ${localPath} in ${Date.now() - start}ms`)
        return info
      }
      catch (error) {
        debug(`Error loading local template: ${error}`)
        // Fall through to remote registry if local template loading fails
      }
    }

    // Fallback to remote registry
    const registryURL = `${registryEndpoint}/${input}.json`

    const result = await sendFetch(registryURL, {
      headers: {
        authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      },
    })
    if (result.status >= 400) {
      throw new Error(
        `Failed to download ${input} template info from ${registryURL}: ${result.status} ${result.statusText}`,
      )
    }
    const info = (await result.json()) as TemplateInfo
    if (!info.tar || !info.name) {
      throw new Error(
        `Invalid template info from ${registryURL}. name or tar fields are missing!`,
      )
    }
    debug(
      `Fetched ${input} template info from ${registryURL} in ${
        Date.now() - start
      }ms`,
    )
    return info
  })
}
