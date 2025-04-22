# Authentication

Gitit supports authentication for private repositories across different providers. This page covers advanced authentication techniques and best practices.

## Authentication Methods

### Access Tokens

The most common authentication method is using personal access tokens:

```bash
gitit template github:user/private-repo my-project --auth "your-access-token"
```

You can also provide authentication via environment variables:

```bash
export GITIT_AUTH="your-access-token"
gitit template github:user/private-repo my-project
```

The environment variable `GITIT_AUTH` is checked by default if no `--auth` parameter is provided.

## Provider-Specific Authentication

Each provider has its own authentication mechanism, but Gitit handles them all using the Bearer token method:

```
Authorization: Bearer your-access-token
```

### GitHub

For GitHub, you need a [Personal Access Token (PAT)](https://github.com/settings/tokens):

```bash
gitit template github:user/private-repo my-project --auth "ghp_xxxxxxxxxxxxxxx"
```

GitHub API calls use the following headers:

```
Authorization: Bearer your-access-token
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

### GitLab

For GitLab, you need a [Personal Access Token](https://gitlab.com/-/profile/personal_access_tokens):

```bash
gitit template gitlab:user/private-repo my-project --auth "glpat-xxxxxxxxxxxxxxx"
```

### Bitbucket

For Bitbucket, you need an [App Password](https://bitbucket.org/account/settings/app-passwords/):

```bash
gitit template bitbucket:user/private-repo my-project --auth "your-app-password"
```

### SourceHut

For SourceHut, use your [OAuth token](https://meta.sr.ht/oauth):

```bash
gitit template sourcehut:user/private-repo my-project --auth "your-oauth-token"
```

## Custom GitHub or GitLab Instances

If you're using a GitHub Enterprise or custom GitLab instance, you can set the API URL using environment variables:

```bash
# For GitHub Enterprise
export GITIT_GITHUB_URL="https://github.your-company.com/api/v3"
gitit template github:user/private-repo my-project

# For GitLab self-hosted
export GITIT_GITLAB_URL="https://gitlab.your-company.com"
gitit template gitlab:user/private-repo my-project
```

## Secure Authentication Practices

### Environment Variables

Using environment variables is more secure than passing tokens directly in commands:

```bash
# Add to your .bashrc, .zshrc, etc.
export GITIT_AUTH="your-access-token"
```

### Configuration File

You can store your authentication token in your `gitit.config.ts` file (but be careful not to commit this file):

```typescript
// gitit.config.ts
export default {
  auth: process.env.GITIT_AUTH || 'your-access-token',
  // other options...
}
```

### CI/CD Integration

When using Gitit in CI/CD pipelines, set up secrets in your CI environment:

```yaml
# GitHub Actions example
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Clone template
        run: gitit template github:user/private-repo my-project
        env:
          GITIT_AUTH: ${{ secrets.GITHUB_TOKEN }}
```

## How Authentication Works in Gitit

When you provide an authentication token, Gitit:

1. Adds it to the HTTP request headers when downloading the template
2. Uses the Bearer authentication method (`Authorization: Bearer your-token`)
3. Passes the appropriate headers specific to each provider
4. The download is performed using the authenticated request
5. If the token has sufficient permissions, the private repository will be accessible

## Troubleshooting Authentication Issues

### Common Problems

1. **Expired tokens**: Most tokens expire after a certain period
2. **Insufficient permissions**: Ensure your token has the required scopes
3. **Rate limiting**: Too many requests can lead to rate limiting
4. **Organization restrictions**: Some organizations restrict token usage

### Solutions

1. Generate a new token with appropriate scopes
2. Check if the repository exists and you have access to it
3. Ensure your token is formatted correctly
4. Contact your organization administrator for access issues
