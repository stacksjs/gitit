# Bitbucket Support

Clone templates from Bitbucket repositories.

## Basic Usage

```bash
# Clone from Bitbucket
gitit bitbucket:user/repo my-project

# Clone specific branch
gitit bitbucket:user/repo#main my-project

# Clone with full URL
gitit https://bitbucket.org/user/repo my-project
```

## URL Formats

```bash
# Short format
gitit bitbucket:workspace/repo

# Full URL format
gitit https://bitbucket.org/workspace/repo

# With branch
gitit bitbucket:workspace/repo#develop
```

## Private Repositories

For private Bitbucket repositories, use app passwords:

```bash
# Using --auth flag
gitit bitbucket:workspace/private-repo my-project --auth username:app_password

# Using environment variable
export BITBUCKET_TOKEN=username:app_password
gitit bitbucket:workspace/private-repo my-project
```

### Creating an App Password

1. Go to Bitbucket Settings > App passwords
2. Create new app password with `repository:read` permission
3. Use format: `username:app_password`

## Bitbucket Server

For Bitbucket Server (self-hosted), provide the full URL:

```bash
gitit https://bitbucket.mycompany.com/scm/project/repo.git my-project
```

## Workspace Templates

Clone from Bitbucket workspaces:

```bash
# Public workspace
gitit bitbucket:atlassian/example-template

# Private workspace
gitit bitbucket:myworkspace/internal-template --auth $BITBUCKET_TOKEN
```

## Library Usage

```ts
import { downloadTemplate } from '@stacksjs/gitit'

const result = await downloadTemplate('bitbucket:workspace/repo', {
  dir: './my-project',
  auth: 'username:app_password',
})

console.log(`Cloned to ${result.dir}`)
```

## Options

| Option | Description |
|--------|-------------|
| `--auth <credentials>` | Username:password or app password |
| `--force` | Clone to existing directory |
| `--install` | Install dependencies after clone |

## Troubleshooting

### Authentication Errors

If you get authentication errors:

1. Verify app password has `repository:read` permission
2. Check username is correct
3. Ensure password is not URL-encoded in the wrong format

### Rate Limiting

Bitbucket has API rate limits. Authenticated requests have higher limits.

### SSH URLs

SSH URLs are not currently supported. Use HTTPS URLs instead.
