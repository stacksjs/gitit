# Authentication

gitit supports authentication for accessing private repositories across GitHub, GitLab, and Bitbucket. This guide covers setting up and using authentication tokens.

## Quick Start

Set up authentication using environment variables:

```bash
# GitHub
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# GitLab
export GITLAB_TOKEN=glpat-xxxxxxxxxxxx

# Bitbucket
export BITBUCKET_TOKEN=xxxxxxxxxxxx
```

Then download private templates:

```bash
gitit private-org/private-repo
```

## Authentication Methods

### Environment Variables

gitit automatically reads tokens from environment variables:

| Provider | Environment Variable |
|----------|---------------------|
| GitHub | `GITHUB_TOKEN` or `GH_TOKEN` |
| GitLab | `GITLAB_TOKEN` or `GL_TOKEN` |
| Bitbucket | `BITBUCKET_TOKEN` or `BB_TOKEN` |

### CLI Flag

Pass the token directly via CLI:

```bash
gitit private-org/repo --auth ghp_xxxxxxxxxxxx
```

### Programmatic API

```typescript
import { downloadTemplate } from 'gitit'

await downloadTemplate('private-org/private-repo', {
  dir: './my-project',
  auth: process.env.GITHUB_TOKEN,
})
```

## Provider-Specific Setup

### GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` - Full control of private repositories
4. Copy the generated token

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
gitit private-org/private-repo
```

### GitHub Fine-Grained Token

For more security, use fine-grained tokens:

1. Go to [GitHub Settings > Developer Settings > Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Select the repository or organization
3. Set permissions:
   - Repository permissions > Contents > Read-only
4. Generate and copy token

### GitLab Personal Access Token

1. Go to [GitLab Settings > Access Tokens](https://gitlab.com/-/profile/personal_access_tokens)
2. Create a new token with:
   - `read_repository` scope
3. Copy the generated token

```bash
export GITLAB_TOKEN=glpat-xxxxxxxxxxxx
gitit gitlab:private-org/private-repo
```

### Bitbucket App Password

1. Go to [Bitbucket Settings > App passwords](https://bitbucket.org/account/settings/app-passwords/)
2. Create an app password with:
   - `Repositories: Read` permission
3. Use format `username:app_password`

```bash
export BITBUCKET_TOKEN=username:xxxxxxxxxxxx
gitit bitbucket:private-org/private-repo
```

## Configuration File

Store authentication in a configuration file:

```typescript
// gitit.config.ts
export default {
  auth: {
    github: process.env.GITHUB_TOKEN,
    gitlab: process.env.GITLAB_TOKEN,
    bitbucket: process.env.BITBUCKET_TOKEN,
  },
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Download Template
on: workflow_dispatch

jobs:
  download:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download private template
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npx gitit private-org/template ./my-app
```

### GitLab CI

```yaml
download-template:
  script:
    - export GITLAB_TOKEN=$CI_JOB_TOKEN
    - npx gitit gitlab:private-org/template ./my-app
```

### Bitbucket Pipelines

```yaml
pipelines:
  default:
    - step:
        script:
          - export BITBUCKET_TOKEN=$BITBUCKET_APP_PASSWORD
          - npx gitit bitbucket:private-org/template ./my-app
```

## Security Best Practices

1. **Use environment variables**: Never hardcode tokens in code
2. **Limit token scopes**: Only grant necessary permissions
3. **Rotate tokens regularly**: Update tokens periodically
4. **Use secrets management**: Store tokens in CI/CD secret managers
5. **Fine-grained tokens**: Prefer fine-grained tokens over classic PATs

## Troubleshooting

### Authentication Failed

```bash
# Verify token is set
echo $GITHUB_TOKEN

# Test token validity
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Check repository access
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/repos/org/repo
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid token | Regenerate token |
| `403 Forbidden` | Insufficient permissions | Add required scopes |
| `404 Not Found` | No access or doesn't exist | Check token has repo access |

## Related

- [Template Downloads](/features/template-downloads) - Basic download usage
- [Advanced Authentication](/advanced/authentication) - Enterprise setups
- [CI/CD Integration](/advanced/ci-cd) - Automated workflows
