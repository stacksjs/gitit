# Custom Providers

gitit's plugin system allows you to create custom providers for any Git hosting service or template registry. This guide covers creating and registering custom providers.

## Provider Interface

All providers implement the `Provider` interface:

```typescript
interface Provider {
  name: string
  patterns: RegExp[]
  resolve(input: string): Promise<ResolvedTemplate>
  download(template: ResolvedTemplate, options: DownloadOptions): Promise<DownloadResult>
  authenticate?(token: string): void
}

interface ResolvedTemplate {
  provider: string
  owner: string
  repo: string
  ref?: string
  subdir?: string
  url: string
}
```

## Creating a Custom Provider

### Basic Provider

```typescript
import type { Provider, ResolvedTemplate, DownloadOptions } from 'gitit'

export const customProvider: Provider = {
  name: 'custom',

  // Patterns that match this provider
  patterns: [
    /^custom:/,
    /^https:\/\/custom\.example\.com/,
  ],

  // Resolve input to template info
  async resolve(input: string): Promise<ResolvedTemplate> {
    const cleaned = input.replace(/^custom:/, '')
    const [owner, repo, ...subdir] = cleaned.split('/')

    return {
      provider: 'custom',
      owner,
      repo,
      subdir: subdir.join('/') || undefined,
      url: `https://custom.example.com/${owner}/${repo}`,
    }
  },

  // Download the template
  async download(
    template: ResolvedTemplate,
    options: DownloadOptions
  ): Promise<DownloadResult> {
    const tarballUrl = `${template.url}/archive/main.tar.gz`

    const response = await fetch(tarballUrl, {
      headers: this.authHeaders,
    })

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    await extractTarball(buffer, options.dir, template.subdir)

    return {
      dir: options.dir,
      source: template.url,
    }
  },

  // Optional authentication
  private authHeaders: Record<string, string> = {},

  authenticate(token: string) {
    this.authHeaders = {
      Authorization: `Bearer ${token}`,
    }
  },
}
```

### Registering the Provider

```typescript
import { registerProvider } from 'gitit'
import { customProvider } from './custom-provider'

registerProvider(customProvider)

// Now you can use it
await downloadTemplate('custom:owner/repo')
```

## Advanced Provider Features

### Version/Ref Support

```typescript
async resolve(input: string): Promise<ResolvedTemplate> {
  const [source, ref] = input.split('#')
  const [owner, repo, ...subdir] = source.replace(/^custom:/, '').split('/')

  return {
    provider: 'custom',
    owner,
    repo,
    ref: ref || 'main',
    subdir: subdir.join('/') || undefined,
    url: `https://custom.example.com/${owner}/${repo}`,
  }
}
```

### API-Based Resolution

```typescript
async resolve(input: string): Promise<ResolvedTemplate> {
  const [owner, repo] = input.replace(/^custom:/, '').split('/')

  // Fetch repository info from API
  const response = await fetch(
    `https://api.custom.example.com/repos/${owner}/${repo}`
  )
  const repoInfo = await response.json()

  return {
    provider: 'custom',
    owner,
    repo,
    ref: repoInfo.defaultBranch,
    url: repoInfo.htmlUrl,
  }
}
```

### Caching Support

```typescript
import { cache } from 'gitit'

async download(
  template: ResolvedTemplate,
  options: DownloadOptions
): Promise<DownloadResult> {
  const cacheKey = `${template.owner}/${template.repo}@${template.ref}`

  // Check cache first
  if (options.preferOffline) {
    const cached = await cache.get(cacheKey)
    if (cached) {
      await extractFromCache(cached, options.dir)
      return { dir: options.dir, source: template.url, cached: true }
    }
  }

  // Download and cache
  const tarball = await this.fetchTarball(template)
  await cache.set(cacheKey, tarball)
  await extractTarball(tarball, options.dir)

  return { dir: options.dir, source: template.url, cached: false }
}
```

## Self-Hosted Git Services

### GitLab Self-Hosted

```typescript
import type { Provider } from 'gitit'

export function createGitLabProvider(baseUrl: string): Provider {
  return {
    name: 'gitlab-self',
    patterns: [new RegExp(`^${escapeRegex(baseUrl)}`)],

    async resolve(input: string) {
      const path = input.replace(baseUrl, '').replace(/^\//, '')
      const [owner, repo, ...rest] = path.split('/')

      return {
        provider: 'gitlab-self',
        owner,
        repo,
        url: `${baseUrl}/${owner}/${repo}`,
      }
    },

    async download(template, options) {
      const archiveUrl = `${template.url}/-/archive/main/${template.repo}-main.tar.gz`
      // ... download logic
    },
  }
}

// Usage
const provider = createGitLabProvider('https://gitlab.company.com')
registerProvider(provider)
```

### Gitea/Forgejo

```typescript
export function createGiteaProvider(baseUrl: string): Provider {
  return {
    name: 'gitea',
    patterns: [new RegExp(`^gitea:${escapeRegex(baseUrl)}`)],

    async resolve(input) {
      const path = input.replace(`gitea:${baseUrl}/`, '')
      const [owner, repo] = path.split('/')

      return {
        provider: 'gitea',
        owner,
        repo,
        url: `${baseUrl}/${owner}/${repo}`,
      }
    },

    async download(template, options) {
      const archiveUrl = `${template.url}/archive/main.tar.gz`
      // ... download logic
    },
  }
}
```

## Template Registries

### NPM-Style Registry

```typescript
export const npmRegistryProvider: Provider = {
  name: 'npm-registry',
  patterns: [/^npm:/],

  async resolve(input) {
    const packageName = input.replace(/^npm:/, '')

    // Fetch from npm registry
    const response = await fetch(
      `https://registry.npmjs.org/${packageName}/latest`
    )
    const pkg = await response.json()

    return {
      provider: 'npm-registry',
      owner: pkg.author?.name || 'unknown',
      repo: packageName,
      url: pkg.repository?.url || '',
      tarball: pkg.dist.tarball,
    }
  },

  async download(template, options) {
    const response = await fetch(template.tarball)
    const buffer = await response.arrayBuffer()
    await extractTarball(buffer, options.dir)
    return { dir: options.dir, source: template.url }
  },
}
```

### Custom Registry API

```typescript
export const customRegistryProvider: Provider = {
  name: 'registry',
  patterns: [/^registry:/],

  async resolve(input) {
    const templateId = input.replace(/^registry:/, '')

    const response = await fetch(
      `https://templates.example.com/api/v1/templates/${templateId}`
    )
    const template = await response.json()

    return {
      provider: 'registry',
      owner: template.author,
      repo: template.name,
      url: template.downloadUrl,
    }
  },

  async download(template, options) {
    // Download from registry
  },
}
```

## Provider Configuration

```typescript
// gitit.config.ts
export default {
  providers: {
    custom: {
      baseUrl: 'https://git.example.com',
      auth: process.env.CUSTOM_TOKEN,
      apiVersion: 'v2',
    },
  },
}
```

Access config in provider:

```typescript
import { getProviderConfig } from 'gitit'

export const customProvider: Provider = {
  name: 'custom',

  async resolve(input) {
    const config = getProviderConfig('custom')
    // Use config.baseUrl, config.auth, etc.
  },
}
```

## Testing Providers

```typescript
import { describe, it, expect } from 'bun:test'
import { customProvider } from './custom-provider'

describe('customProvider', () => {
  it('should match custom: prefix', () => {
    expect(customProvider.patterns[0].test('custom:owner/repo')).toBe(true)
  })

  it('should resolve template info', async () => {
    const result = await customProvider.resolve('custom:owner/repo')
    expect(result.owner).toBe('owner')
    expect(result.repo).toBe('repo')
  })

  it('should download template', async () => {
    const template = await customProvider.resolve('custom:owner/repo')
    const result = await customProvider.download(template, { dir: './test' })
    expect(result.dir).toBe('./test')
  })
})
```

## Related

- [Configuration](/advanced/configuration) - Configure custom providers
- [CI/CD Integration](/advanced/ci-cd) - Use custom providers in CI
- [Authentication](/features/authentication) - Provider authentication
