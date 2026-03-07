# Template Downloads

gitit provides a powerful and flexible template download system that works with multiple Git providers. This page covers the core functionality for downloading and extracting templates.

## Basic Usage

Download a template from any supported provider:

```bash
# From GitHub
gitit stacksjs/starter

# From GitLab
gitit gitlab:user/repo

# From Bitbucket
gitit bitbucket:user/repo

# Specify destination
gitit stacksjs/starter my-project
```

## Programmatic API

Use gitit programmatically in your Node.js/Bun applications:

```typescript
import { downloadTemplate } from 'gitit'

// Basic download
const result = await downloadTemplate('stacksjs/starter', {
  dir: './my-project',
})

console.log('Template downloaded to:', result.dir)

// With options
const result = await downloadTemplate('stacksjs/starter', {
  dir: './my-project',
  force: true,
  preferOffline: true,
  install: true,
})
```

## Download Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dir` | `string` | `'.'` | Target directory for the template |
| `force` | `boolean` | `false` | Overwrite existing directory |
| `preferOffline` | `boolean` | `false` | Use cached version if available |
| `offline` | `boolean` | `false` | Only use cached version |
| `install` | `boolean` | `false` | Run package manager install |
| `silent` | `boolean` | `false` | Suppress console output |

### Provider Options

| Option | Type | Description |
|--------|------|-------------|
| `provider` | `string` | Force a specific provider |
| `auth` | `string` | Authentication token |
| `registry` | `string` | Custom registry URL |

## Template Sources

gitit supports various template source formats:

```typescript
// Owner/repo format
await downloadTemplate('stacksjs/starter')

// Full URL
await downloadTemplate('https://github.com/stacksjs/starter')

// With branch/tag/commit
await downloadTemplate('stacksjs/starter#main')
await downloadTemplate('stacksjs/starter#v1.0.0')
await downloadTemplate('stacksjs/starter#abc123')

// Subdirectory
await downloadTemplate('stacksjs/monorepo/packages/app')
```

## Post-Download Hooks

Execute commands after template extraction:

```typescript
import { downloadTemplate } from 'gitit'

await downloadTemplate('stacksjs/starter', {
  dir: './my-project',
  install: true, // Run package install
})
```

## Error Handling

Handle download errors gracefully:

```typescript
import { downloadTemplate } from 'gitit'

try {
  const result = await downloadTemplate('stacksjs/starter', {
    dir: './my-project',
  })
  console.log('Success:', result)
} catch (error) {
  if (error.code === 'ENOTFOUND') {
    console.error('Template not found')
  } else if (error.code === 'EEXIST') {
    console.error('Directory already exists')
  } else {
    console.error('Download failed:', error.message)
  }
}
```

## CLI Options

The CLI provides all download options as flags:

```bash
# Force overwrite
gitit stacksjs/starter --force

# Offline mode
gitit stacksjs/starter --offline

# Silent mode
gitit stacksjs/starter --silent

# Install dependencies
gitit stacksjs/starter --install

# Specify provider
gitit user/repo --provider github
```

## Best Practices

1. **Use specific versions**: Pin to tags or commits for reproducible downloads
2. **Enable caching**: Use `--prefer-offline` for faster subsequent downloads
3. **Handle errors**: Always wrap downloads in try-catch for production use
4. **Clean directories**: Use `--force` carefully to avoid data loss

## Related

- [Monorepo Support](/features/monorepo-support) - Download subdirectories from monorepos
- [Authentication](/features/authentication) - Access private repositories
- [Caching](/features/caching) - Optimize download performance
