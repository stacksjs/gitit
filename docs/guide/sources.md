# Template Sources

gitit supports downloading templates from multiple source providers including GitHub, GitLab, Bitbucket, and custom registries.

## Supported Providers

| Provider | Prefix | Example |
|----------|--------|---------|
| GitHub | `github:` or `gh:` | `github:user/repo` |
| GitLab | `gitlab:` or `gl:` | `gitlab:user/repo` |
| Bitbucket | `bitbucket:` or `bb:` | `bitbucket:user/repo` |
| Custom URL | (none) | `https://example.com/template.tar.gz` |

## GitHub

The most common source for templates.

### Basic Usage

```bash
# Full syntax
gitit github:stacksjs/ts-starter my-project

# Short syntax
gitit gh:stacksjs/ts-starter my-project
```

### With Branch or Tag

```bash
# Specific branch
gitit github:user/repo#develop my-project

# Specific tag
gitit github:user/repo#v1.0.0 my-project

# Specific commit
gitit github:user/repo#abc123 my-project
```

### Subdirectory Templates

Download only a specific subdirectory:

```bash
# Template in subdirectory
gitit github:user/monorepo/packages/template my-project
```

### Private Repositories

For private repositories, set the `GITHUB_TOKEN` environment variable:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
gitit github:org/private-template my-project
```

Or provide the token inline:

```bash
GITHUB_TOKEN=ghp_xxx gitit github:org/private-template my-project
```

### Programmatic Usage

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

await downloadTemplate('github:stacksjs/ts-starter', {
  dir: './my-project',
  auth: process.env.GITHUB_TOKEN,
})
```

## GitLab

### Basic Usage

```bash
# Full syntax
gitit gitlab:user/repo my-project

# Short syntax
gitit gl:user/repo my-project
```

### With Branch or Tag

```bash
gitit gitlab:user/repo#main my-project
gitit gitlab:user/repo#v2.0.0 my-project
```

### Private Repositories

```bash
export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
gitit gitlab:org/private-template my-project
```

### Self-Hosted GitLab

For self-hosted GitLab instances:

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

await downloadTemplate('gitlab:group/project', {
  dir: './my-project',
  provider: {
    name: 'gitlab',
    url: 'https://gitlab.mycompany.com',
  },
  auth: process.env.GITLAB_TOKEN,
})
```

## Bitbucket

### Basic Usage

```bash
# Full syntax
gitit bitbucket:user/repo my-project

# Short syntax
gitit bb:user/repo my-project
```

### With Branch or Tag

```bash
gitit bitbucket:user/repo#main my-project
gitit bitbucket:user/repo#v1.0.0 my-project
```

### Private Repositories

```bash
export BITBUCKET_TOKEN=xxx
gitit bitbucket:org/private-template my-project
```

### App Passwords

For Bitbucket, you may need to use an App Password:

```bash
export BITBUCKET_USERNAME=your-username
export BITBUCKET_TOKEN=your-app-password
```

## Custom URLs

Download from any HTTP(S) URL:

```bash
# Direct URL to tarball
gitit https://example.com/template.tar.gz my-project

# ZIP file
gitit https://example.com/template.zip my-project
```

### Custom Registries

Create a custom template registry:

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

await downloadTemplate('myregistry:template-name', {
  dir: './my-project',
  providers: {
    myregistry: {
      name: 'myregistry',
      url: 'https://templates.mycompany.com',
      pattern: '{{name}}/{{version}}/download.tar.gz',
    },
  },
})
```

## Provider Configuration

### Default Provider

Set a default provider:

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

// No prefix needed when using default provider
await downloadTemplate('stacksjs/ts-starter', {
  dir: './my-project',
  defaultProvider: 'github',
})
```

### Multiple Providers

Configure multiple providers:

```typescript
import { downloadTemplate } from '@stacksjs/gitit'

await downloadTemplate('internal:starter-template', {
  dir: './my-project',
  providers: {
    github: {
      name: 'github',
      url: 'https://github.com',
    },
    internal: {
      name: 'internal',
      url: 'https://templates.internal.company.com',
      auth: process.env.INTERNAL_TOKEN,
    },
  },
})
```

## Authentication

### Environment Variables

| Provider | Variable | Description |
|----------|----------|-------------|
| GitHub | `GITHUB_TOKEN` | Personal access token |
| GitLab | `GITLAB_TOKEN` | Personal access token |
| Bitbucket | `BITBUCKET_TOKEN` | App password |

### Programmatic Auth

```typescript
await downloadTemplate('github:user/repo', {
  dir: './my-project',
  auth: 'token-here',
})
```

### OAuth Tokens

For OAuth-based authentication:

```typescript
await downloadTemplate('github:user/repo', {
  dir: './my-project',
  headers: {
    Authorization: `Bearer ${oauthToken}`,
  },
})
```

## Caching

gitit caches downloaded templates for faster subsequent downloads and offline support.

### Cache Location

Templates are cached in:
- macOS/Linux: `~/.cache/gitit/`
- Windows: `%LOCALAPPDATA%\gitit\cache\`

### Using Cache

```bash
# Force use of cached version (offline mode)
gitit github:user/repo my-project --offline

# Force fresh download
gitit github:user/repo my-project --force-download
```

### Programmatic Cache Control

```typescript
await downloadTemplate('github:user/repo', {
  dir: './my-project',
  offline: true, // Use cached version only
  forceClean: true, // Delete and re-download
})
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Repository doesn't exist | Check repository URL |
| 401 Unauthorized | Missing or invalid auth | Set token environment variable |
| 403 Forbidden | No access to private repo | Check token permissions |

### Programmatic Error Handling

```typescript
import { downloadTemplate, TemplateError } from '@stacksjs/gitit'

try {
  await downloadTemplate('github:user/repo', { dir: './my-project' })
}
catch (error) {
  if (error instanceof TemplateError) {
    console.error(`Template error: ${error.message}`)
    console.error(`Provider: ${error.provider}`)
    console.error(`Status: ${error.status}`)
  }
}
```

## Next Steps

- Learn about [GitHub templates](/providers/github) in detail
- Explore [GitLab templates](/providers/gitlab)
- See [Custom Registries](/providers/custom-registries) for advanced setups
