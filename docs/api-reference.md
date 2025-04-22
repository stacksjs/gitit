# API Reference

This page documents the programmatic API of Gitit, useful for integrating Gitit into your own applications or scripts.

## Core Functions

### downloadTemplate

The main function to download and extract templates.

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

interface DownloadTemplateOptions {
  provider?: string
  force?: boolean
  forceClean?: boolean
  offline?: boolean
  preferOffline?: boolean
  providers?: Record<string, TemplateProvider>
  dir?: string
  registry?: false | string
  cwd?: string
  auth?: string
  install?: boolean
  silent?: boolean
}

interface DownloadTemplateResult {
  name: string // Template name
  tar: string // Tarball URL
  version?: string // Template version
  subdir?: string // Subdirectory path
  url?: string // Template URL
  dir: string // Destination directory where template was extracted
  source: string // Original source input
  [key: string]: any // Additional properties
}

async function downloadTemplate(
  input: string,
  options?: DownloadTemplateOptions
): Promise<DownloadTemplateResult>
```

#### Parameters

- `input` - Template identifier (e.g., `github:user/repo`)
- `options` - Configuration options (optional)

#### Options

- `provider` - Override the provider detection (default: 'github' or detected from input)
- `force` - Clone to existing directory even if it exists (default: false)
- `forceClean` - Remove any existing directory or files before cloning (default: false)
- `offline` - Use cached version without downloading (default: false)
- `preferOffline` - Try to use cached version first (default: false)
- `providers` - Custom template providers
- `dir` - Target directory for extraction (default: based on template name)
- `registry` - Template registry URL or false to disable
- `cwd` - Working directory to resolve relative paths (default: current directory)
- `auth` - Authentication token (can also be set via GITIT_AUTH environment variable)
- `install` - Install dependencies after cloning (default: false)
- `silent` - Suppress output during installation (default: false)

#### Example

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

async function main() {
  const result = await downloadTemplate('github:stacksjs/starter', {
    dir: './my-project',
    install: true,
  })

  console.log(`Template cloned to ${result.dir}`)
}

main().catch(console.error)
```

## Types

### GitItConfig

The complete configuration interface.

```typescript
interface GitItConfig {
  verbose: boolean // Enable verbose logging
  dir: string // Default clone directory
  force: boolean // Clone to existing directory even if exists
  forceClean: boolean // Remove any existing directory or files before cloning
  shell: boolean // Open shell after cloning
  install: boolean // Install dependencies after cloning
  command: string // Custom command to run after cloning
  auth: string // Authentication token
  cwd: string // Working directory to resolve paths
  offline: boolean // Use offline mode
  preferOffline: boolean // Prefer offline mode
}
```

Default values from the source code:

```typescript
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
}
```

### GitItOptions

A partial version of GitItConfig where all properties are optional.

```typescript
type GitItOptions = Partial<GitItConfig>
```

### GitInfo

Information about a Git repository.

```typescript
interface GitInfo {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'sourcehut'
  repo: string
  subdir: string
  ref: string
}
```

### TemplateInfo

Information about a template.

```typescript
interface TemplateInfo {
  name: string
  tar: string
  version?: string
  subdir?: string
  url?: string
  defaultDir?: string
  headers?: Record<string, string | undefined>

  // Added by giget
  source?: never
  dir?: never

  [key: string]: any
}
```

### TemplateProvider

A function that returns template information.

```typescript
type TemplateProvider = (
  input: string,
  options: { auth?: string },
) => TemplateInfo | Promise<TemplateInfo> | null
```

## Utility Functions

### parseGitURI

Parse a git URL into its components. Used internally to handle different repository formats.

```typescript
import { parseGitURI } from '@stacksjs/gitit'

const info = parseGitURI('user/repo/path#branch')
// {
//   repo: 'user/repo',
//   subdir: '/path',
//   ref: 'branch'
// }
```

### currentShell

Get the current shell path.

```typescript
import { currentShell } from '@stacksjs/gitit'

const shell = currentShell()
// On Unix: '/bin/bash' or process.env.SHELL
// On Windows: 'cmd.exe'
```

### startShell

Open a new shell in the specified directory.

```typescript
import { startShell } from '@stacksjs/gitit'

startShell('./my-project')
```

### cacheDirectory

Get the path to the cache directory.

```typescript
import { cacheDirectory } from '@stacksjs/gitit'

const cachePath = cacheDirectory()
// macOS: ~/.cache/gitit
// Linux: ~/.cache/gitit or $XDG_CACHE_HOME/gitit
// Windows: %TEMP%/gitit
```

## Supported Providers

The following providers are built-in:

```typescript
const providers = {
  http, // HTTP/HTTPS URLs
  https: http, // Alias for http
  github, // GitHub repositories (github:user/repo)
  gh: github, // Alias for github
  gitlab, // GitLab repositories (gitlab:user/repo)
  bitbucket, // Bitbucket repositories (bitbucket:user/repo)
  sourcehut, // SourceHut repositories (sourcehut:user/repo)
}
```

You can register custom providers by passing them in the `providers` option:

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

function customProvider(input, options) {
  // Return a TemplateInfo object
  return {
    name: 'custom-template',
    tar: `https://example.com/${input}.tar.gz`,
    // ...other properties
  }
}

downloadTemplate('custom:my-template', {
  providers: {
    custom: customProvider,
  },
})
```
