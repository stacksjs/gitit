# Using GitHub Private Repositories

This guide will walk you through the process of using private GitHub repositories as templates with gitit.

## Prerequisites

Before you begin, you'll need:

1. A GitHub account with access to private repositories
2. A GitHub Personal Access Token (PAT)
3. gitit installed on your system

## Creating a GitHub Personal Access Token

To access private repositories, you'll need a Personal Access Token:

1. Log in to your GitHub account
2. Click on your profile picture in the top-right corner
3. Select **Settings** from the dropdown menu
4. Scroll down to the bottom of the left sidebar and click on **Developer settings**
5. Click on **Personal access tokens** → **Tokens (classic)**
6. Click **Generate new token** → **Generate new token (classic)**
7. Give your token a descriptive name (e.g., "Gitit Template Access")
8. Select the following scopes:
   - **repo** (Full control of private repositories)
   - **read:packages** (Optional - if you need to access template packages)
9. Click **Generate token**
10. **Important**: Copy your token immediately. You won't be able to see it again!

## Cloning a Private Repository

Once you have your personal access token, you can use it to clone private repositories:

```bash
gitit template github:username/private-repo my-project --auth "ghp_your_token_here"
```

Replace:

- `username` with the GitHub username or organization name
- `private-repo` with your private repository name
- `ghp_your_token_here` with the personal access token you created

## Using Environment Variables

For security and convenience, you can set your token as an environment variable:

```bash
export GITIT_AUTH="ghp_your_token_here"
gitit template github:username/private-repo my-project
```

Add this to your `.bashrc`, `.zshrc`, or equivalent shell configuration file for persistent access.

## GitHub API Headers

When you provide an authentication token, gitit adds the following headers to GitHub API requests:

```
Authorization: Bearer your-token
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

## Troubleshooting

### "Not found" or "404" errors

If you get "Not found" or "404" errors when trying to clone a private repository, check:

1. **Repository name is correct**: Double-check the repository name and username/organization
2. **Token has proper permissions**: Ensure you've given it the "repo" scope
3. **Access to the repository**: Confirm that your GitHub account has access to the repository

### "Rate limit exceeded" errors

GitHub API has rate limits. With authentication, these limits are higher but still exist:

1. **Use token authentication**: Authenticated requests have higher rate limits
2. **Check your rate limit status**: You can check your current rate limit status with:

   ```bash
   curl -H "Authorization: Bearer your-token" https://api.github.com/rate_limit
   ```

## Advanced Usage

### GitHub Enterprise

If you're using GitHub Enterprise, you can set a custom API URL:

```bash
export GITIT_GITHUB_URL="https://github.your-company.com/api/v3"
gitit template github:username/private-repo my-project --auth "your-token"
```

### Specifying Branches

To clone a specific branch from a private GitHub repository:

```bash
gitit template github:username/private-repo#develop my-project --auth "your-token"
```

### Cloning Subdirectories

To clone only a specific subdirectory from a private repository:

```bash
gitit template github:username/private-repo/path/to/directory my-project --auth "your-token"
```

### Combined Branch and Subdirectory

You can specify both a branch and a subdirectory:

```bash
gitit template github:username/private-repo/path/to/directory#develop my-project --auth "your-token"
```

## Configuration File

You can store your GitHub authentication in your `gitit.config.ts` file:

```typescript
// gitit.config.ts
export default {
  auth: process.env.GITIT_AUTH || 'your-token',
  // other options...
}
```

Just be careful not to commit this file to version control if it contains your actual token.

## CI/CD Integration

For CI/CD pipelines, you can use the built-in GitHub token:

```yaml
# GitHub Actions example
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Clone GitHub template
        run: gitit template github:username/private-repo my-project
        env:
          GITIT_AUTH: ${{ secrets.GITHUB_TOKEN }}
```

## Best Practices

1. **Use fine-grained tokens**: GitHub now offers fine-grained tokens with more precise permissions
2. **Set token expiration**: Always set an expiration date for your tokens
3. **Use environment variables**: Avoid putting your token directly in commands
4. **Use specific versions**: Reference specific tags or commits for consistency
5. **Regularly audit tokens**: Periodically review and revoke unused tokens
6. **Use separate tokens**: Create different tokens for different purposes

## GitHub CLI Integration

If you're using GitHub CLI (`gh`), you can create a token and use it directly:

```bash
# Create a token with GitHub CLI
gh auth token

# Use the token with gitit
gitit template github:username/private-repo my-project --auth "$(gh auth token)"
```

This approach avoids storing the token in your environment or files.
