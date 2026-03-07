# GitHub Templates

Clone templates from GitHub repositories.

## Basic Usage

```bash
# Simple clone
gitit github:user/repo my-project

# Clone specific branch
gitit github:user/repo#main my-project

# Clone specific tag
gitit github:user/repo#v1.0.0 my-project

# Clone subdirectory
gitit github:user/repo/subdir my-project
```

## URL Formats

Gitit supports multiple GitHub URL formats:

```bash
# Short format (recommended)
gitit github:stacksjs/ts-starter

# Full URL
gitit https://github.com/stacksjs/ts-starter

# With subdirectory
gitit github:stacksjs/stacks/templates/ts-starter
```

## Private Repositories

For private repositories, provide an authentication token:

```bash
# Using --auth flag
gitit github:org/private-repo my-project --auth YOUR_TOKEN

# Using environment variable
export GITHUB_TOKEN=your_token
gitit github:org/private-repo my-project
```

### Creating a Personal Access Token

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Use the token with `--auth` or set as `GITHUB_TOKEN`

## Options

| Option | Description |
|--------|-------------|
| `--auth <token>` | GitHub personal access token |
| `--force` | Clone even if directory exists |
| `--force-clean` | Remove existing directory before cloning |
| `--install` | Install dependencies after cloning |
| `--shell` | Open shell in cloned directory |
| `--offline` | Use cached template only |
| `--prefer-offline` | Prefer cache, download if needed |

## Organization Templates

Clone from GitHub organizations:

```bash
# Public org template
gitit github:stacksjs/ts-starter my-project

# Private org template
gitit github:myorg/internal-template my-project --auth $GITHUB_TOKEN
```

## GitHub Enterprise

For GitHub Enterprise, provide the full URL:

```bash
gitit https://github.mycompany.com/org/repo my-project --auth $GHE_TOKEN
```

## Branch and Tag Selection

```bash
# Use main branch
gitit github:user/repo#main

# Use specific branch
gitit github:user/repo#feature-branch

# Use specific tag
gitit github:user/repo#v2.0.0

# Use specific commit
gitit github:user/repo#abc1234
```

## Caching

Templates are cached locally for faster subsequent clones:

```bash
# Use cached version only
gitit github:user/repo my-project --offline

# Prefer cache but download if newer
gitit github:user/repo my-project --prefer-offline
```

Cache location: `~/.cache/gitit/`

## Library Usage

```ts
import { downloadTemplate } from '@stacksjs/gitit'

const result = await downloadTemplate('github:user/repo', {
  dir: './my-project',
  auth: process.env.GITHUB_TOKEN,
  force: true,
})

console.log(`Cloned to ${result.dir}`)
```

## Best Practices

### Template Structure

Organize your template with:

```
my-template/
├── .gitignore
├── README.md
├── package.json
├── src/
│   └── index.ts
└── templates/  # Optional: sub-templates
```

### Template Variables

Use placeholder strings that users can replace:

```json
{
  "name": "{{project-name}}",
  "author": "{{author}}"
}
```

### Including Setup Scripts

Add a post-install script:

```bash
gitit github:user/repo my-project --command "bun run setup"
```

## Troubleshooting

### Rate Limiting

GitHub has API rate limits. For authenticated requests:
- 5,000 requests/hour with token
- 60 requests/hour without token

### Clone Failures

If cloning fails:

1. Check repository URL is correct
2. Verify repository is accessible
3. For private repos, ensure token has proper scopes
4. Try `--force-clean` to remove any partial downloads

### Cache Issues

Clear the cache if you encounter stale data:

```bash
rm -rf ~/.cache/gitit/
```
