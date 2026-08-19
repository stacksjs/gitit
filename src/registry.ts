import type { TemplateInfo, TemplateProvider } from './types'
import { localTemplates } from './templates/index'
import { debug, sendFetch } from './utils'

const DEFAULT_REGISTRY = 'https://raw.githubusercontent.com/unjs/giget/main/templates'

export function registryProvider(registryEndpoint: string = DEFAULT_REGISTRY, options: { auth?: string } = {}) {
  return <TemplateProvider > (async (input) => {
    const start = Date.now()

    // Built-in templates are embedded in source (see ./templates/index.ts)
    // rather than read from disk at runtime — a path resolved relative to
    // process.cwd() or import.meta.url breaks depending on whether gitit
    // runs from source, a bundled dist/bin/cli.js, or via `bunx`, none of
    // which reliably locate a sibling `templates/*.json` on disk.
    const builtin = localTemplates[input]
    if (builtin) {
      debug(`Loaded ${input} template info from built-in templates in ${Date.now() - start}ms`)
      return builtin
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
