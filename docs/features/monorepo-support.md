# Monorepo Support

gitit provides first-class support for downloading templates from monorepos. Extract specific packages, apps, or any subdirectory from large repositories.

## Basic Usage

Download a subdirectory from a monorepo:

```bash
# Download a specific package
gitit stacksjs/stacks/packages/cli

# Download an example app
gitit vercel/next.js/examples/with-tailwindcss

# Download a template from a templates folder
gitit org/repo/templates/starter
```

## Subdirectory Syntax

Specify subdirectories using forward slashes after the repository:

```bash
# Format: owner/repo/path/to/directory
gitit owner/repo/packages/my-package
gitit owner/repo/apps/web
gitit owner/repo/examples/basic
```

## Programmatic API

```typescript
import { downloadTemplate } from 'gitit'

// Download a subdirectory
const result = await downloadTemplate('stacksjs/stacks/packages/cli', {
  dir: './my-cli',
})

// With branch specification
const result = await downloadTemplate('stacksjs/stacks/packages/cli#main', {
  dir: './my-cli',
})
```

## Common Monorepo Patterns

### Turborepo Structure

```bash
# Download an app
gitit org/turborepo/apps/web

# Download a package
gitit org/turborepo/packages/ui

# Download shared config
gitit org/turborepo/packages/config
```

### Nx Workspace Structure

```bash
# Download an application
gitit org/nx-workspace/apps/my-app

# Download a library
gitit org/nx-workspace/libs/shared-ui
```

### Lerna/npm Workspaces

```bash
# Download a package
gitit org/monorepo/packages/core

# Download a plugin
gitit org/monorepo/packages/plugin-auth
```

## Provider-Specific Examples

### GitHub Monorepos

```bash
# React examples
gitit facebook/react/fixtures/concurrent

# Vue templates
gitit vuejs/vue/examples/todomvc

# Next.js examples
gitit vercel/next.js/examples/blog
```

### GitLab Monorepos

```bash
gitit gitlab:org/monorepo/packages/api
```

### Bitbucket Monorepos

```bash
gitit bitbucket:org/monorepo/services/auth
```

## Advanced Options

### Combine with Other Features

```typescript
import { downloadTemplate } from 'gitit'

// Download subdirectory with authentication
await downloadTemplate('private-org/monorepo/packages/core', {
  dir: './core',
  auth: process.env.GITHUB_TOKEN,
})

// Download subdirectory with install
await downloadTemplate('stacksjs/stacks/packages/cli', {
  dir: './cli',
  install: true,
})

// Force overwrite existing
await downloadTemplate('org/repo/templates/starter', {
  dir: './my-project',
  force: true,
})
```

### Branch-Specific Subdirectories

```bash
# Download from a specific branch
gitit org/repo/packages/new-feature#feature-branch

# Download from a tag
gitit org/repo/packages/stable#v2.0.0

# Download from a commit
gitit org/repo/packages/core#abc1234
```

## CLI Examples

```bash
# Download with destination
gitit vercel/next.js/examples/with-tailwindcss my-tailwind-app

# Force overwrite
gitit org/monorepo/templates/starter --force

# Install dependencies after download
gitit org/monorepo/packages/cli --install

# Silent mode
gitit org/monorepo/examples/demo --silent
```

## Best Practices

1. **Be specific**: Use exact paths to avoid downloading unnecessary files
2. **Pin versions**: Use branch/tag references for reproducible downloads
3. **Check structure**: Verify the monorepo structure before downloading
4. **Handle missing paths**: Gracefully handle cases where the subdirectory doesn't exist

## Error Handling

```typescript
import { downloadTemplate } from 'gitit'

try {
  await downloadTemplate('org/repo/non-existent-path', {
    dir: './output',
  })
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('Subdirectory does not exist in the repository')
  }
}
```

## Related

- [Template Downloads](/features/template-downloads) - Basic download functionality
- [Authentication](/features/authentication) - Access private monorepos
- [Custom Providers](/advanced/custom-providers) - Create custom registry support
