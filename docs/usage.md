# Usage

There are two ways of using gitit: _as a library or as a CLI._

## Library

Given the npm package is installed:

```ts
import type { GitItOptions } from '@stacksjs/gitit'
import { downloadTemplate } from '@stacksjs/gitit'

const options: GitItOptions = {
  dir: './my-project',
  force: false,
  forceClean: false,
  shell: true,
  install: true,
  verbose: true,
  command: 'npm run dev',
  offline: false,
  preferOffline: false,
}

// Clone a template
const result = await downloadTemplate('github:user/repo', options)
console.log(`Successfully cloned to ${result.dir}`)
```

## CLI

The CLI provides a simple way to clone templates:

```bash
# Basic usage
gitit github:user/repo my-project

# With options
gitit github:user/repo my-project --install --shell

# Clone with force option to overwrite existing directory
gitit github:user/repo my-project --force

# Clean the directory before cloning
gitit github:user/repo my-project --force-clean

# Run custom command after cloning
gitit github:user/repo my-project --command "npm run dev"

# Use offline mode
gitit github:user/repo my-project --offline

# Prefer offline mode (use cache if available)
gitit github:user/repo my-project --prefer-offline

# Authentication for private repositories
gitit github:user/private-repo my-project --auth "your-token"

# Set working directory
gitit github:user/repo my-project --cwd "/path/to/parent"

# Show help
gitit --help

# Show version
gitit version
```

## Supported Template Sources

Gitit supports cloning templates from various sources:

- **GitHub**: `github:user/repo` or `gh:user/repo`
- **GitLab**: `gitlab:user/repo` or `gl:user/repo`
- **Bitbucket**: `bitbucket:user/repo` or `bb:user/repo`
- **SourceHut**: `sourcehut:user/repo` or `sh:user/repo`

You can also specify subdirectories and branches:

```bash
# Clone from a specific branch
gitit github:user/repo#dev my-project

# Clone from a specific subdirectory
gitit github:user/repo/packages/ui my-project

# Clone from a specific branch and subdirectory
gitit github:user/repo/packages/ui#dev my-project
```

## Testing

```bash
bun test
```
