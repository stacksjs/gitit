# Configuration Deep-Dive

gitit supports comprehensive configuration through config files, environment variables, and CLI options. This guide covers all configuration options and advanced usage patterns.

## Configuration File

Create a `gitit.config.ts` file in your project root:

```typescript
import type { GitItConfig } from 'gitit'

export default {
  // Default provider
  provider: 'github',

  // Default options for all downloads
  defaults: {
    install: true,
    force: false,
    preferOffline: true,
  },

  // Provider-specific settings
  providers: {
    github: {
      auth: process.env.GITHUB_TOKEN,
      apiUrl: 'https://api.github.com',
    },
    gitlab: {
      auth: process.env.GITLAB_TOKEN,
      apiUrl: 'https://gitlab.com/api/v4',
    },
    bitbucket: {
      auth: process.env.BITBUCKET_TOKEN,
      apiUrl: 'https://api.bitbucket.org/2.0',
    },
  },

  // Cache settings
  cache: {
    enabled: true,
    ttl: 86400000, // 24 hours
    directory: '~/.cache/gitit',
  },

  // Template aliases
  aliases: {
    starter: 'stacksjs/starter',
    vue: 'stacksjs/stacks/templates/vue',
    react: 'stacksjs/stacks/templates/react',
  },

  // Post-download hooks
  hooks: {
    afterDownload: async (result) => {
      console.log(`Downloaded to ${result.dir}`)
    },
  },
} satisfies GitItConfig
```

## Configuration Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | `string` | `'github'` | Default Git provider |
| `registry` | `string` | `undefined` | Custom registry URL |
| `timeout` | `number` | `30000` | Request timeout in ms |
| `retries` | `number` | `3` | Number of retry attempts |

### Download Defaults

```typescript
export default {
  defaults: {
    dir: '.', // Default output directory
    force: false, // Overwrite existing
    install: false, // Run package install
    silent: false, // Suppress output
    preferOffline: false, // Prefer cached
    offline: false, // Only use cached
  },
}
```

### Provider Configuration

```typescript
export default {
  providers: {
    github: {
      auth: process.env.GITHUB_TOKEN,
      apiUrl: 'https://api.github.com',
      rawUrl: 'https://raw.githubusercontent.com',
      headers: {
        'User-Agent': 'gitit',
      },
    },
    gitlab: {
      auth: process.env.GITLAB_TOKEN,
      apiUrl: 'https://gitlab.com/api/v4',
      selfHosted: false,
    },
    bitbucket: {
      auth: process.env.BITBUCKET_TOKEN,
      apiUrl: 'https://api.bitbucket.org/2.0',
    },
  },
}
```

### Self-Hosted Providers

```typescript
export default {
  providers: {
    gitlab: {
      apiUrl: 'https://gitlab.company.com/api/v4',
      selfHosted: true,
      auth: process.env.GITLAB_TOKEN,
    },
    github: {
      apiUrl: 'https://github.company.com/api/v3',
      rawUrl: 'https://raw.github.company.com',
      auth: process.env.GHE_TOKEN,
    },
  },
}
```

## Environment Variables

gitit reads these environment variables:

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub authentication |
| `GITLAB_TOKEN` | GitLab authentication |
| `BITBUCKET_TOKEN` | Bitbucket authentication |
| `GITIT_CACHE_DIR` | Custom cache directory |
| `GITIT_CONFIG` | Path to config file |
| `GITIT_PROVIDER` | Default provider |
| `GITIT_TIMEOUT` | Request timeout |
| `NO_COLOR` | Disable colored output |

## Template Aliases

Define shortcuts for frequently used templates:

```typescript
export default {
  aliases: {
    // Simple aliases
    starter: 'stacksjs/starter',
    api: 'stacksjs/api-starter',

    // With options
    'vue-app': {
      source: 'stacksjs/stacks/templates/vue',
      install: true,
    },

    // Provider-specific
    'gl-template': 'gitlab:myorg/template',
  },
}
```

Use aliases:

```bash
gitit starter my-project
gitit vue-app my-vue-app
```

## Hooks

Execute custom logic at various stages:

```typescript
export default {
  hooks: {
    // Before download starts
    beforeDownload: async (options) => {
      console.log('Downloading:', options.source)
      return options // Can modify options
    },

    // After download completes
    afterDownload: async (result) => {
      console.log('Downloaded to:', result.dir)

      // Custom post-processing
      await runCustomSetup(result.dir)
    },

    // On error
    onError: async (error, options) => {
      console.error('Failed:', error.message)
      // Could send to error tracking
    },

    // Before install
    beforeInstall: async (dir) => {
      console.log('Installing dependencies...')
    },

    // After install
    afterInstall: async (dir) => {
      console.log('Dependencies installed')
    },
  },
}
```

## Multiple Configurations

### Per-Project Config

Create `.gitit.config.ts` in your project:

```typescript
export default {
  defaults: {
    install: true,
  },
}
```

### User-Level Config

Create in home directory `~/.gitit/config.ts`:

```typescript
export default {
  providers: {
    github: {
      auth: process.env.GITHUB_TOKEN,
    },
  },
  cache: {
    ttl: 604800000, // 7 days
  },
}
```

### Config Precedence

1. CLI flags (highest)
2. Project config (`.gitit.config.ts`)
3. User config (`~/.gitit/config.ts`)
4. Environment variables
5. Default values (lowest)

## Programmatic Configuration

```typescript
import { downloadTemplate, configure } from 'gitit'

// Set global configuration
configure({
  provider: 'github',
  cache: {
    enabled: true,
    ttl: 3600000,
  },
})

// Override per-download
await downloadTemplate('stacksjs/starter', {
  cache: false, // Override global
})
```

## Validation

gitit validates configuration on load:

```typescript
import { validateConfig } from 'gitit'

const config = await validateConfig('./gitit.config.ts')

if (config.errors.length > 0) {
  console.error('Config errors:', config.errors)
}
```

## Debug Mode

Enable verbose logging for troubleshooting:

```bash
DEBUG=gitit:* gitit stacksjs/starter
```

Or in config:

```typescript
export default {
  debug: true,
  logLevel: 'verbose', // 'silent' | 'error' | 'warn' | 'info' | 'verbose'
}
```

## Related

- [Custom Providers](/advanced/custom-providers) - Create custom provider support
- [CI/CD Integration](/advanced/ci-cd) - Automated workflows
- [Performance](/advanced/performance) - Optimization techniques
