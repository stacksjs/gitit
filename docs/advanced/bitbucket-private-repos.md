# Using Bitbucket Private Repositories

This guide will walk you through the process of using private Bitbucket repositories as templates with gitit.

## Prerequisites

Before you begin, you'll need:

1. A Bitbucket account with access to private repositories
2. A Bitbucket App Password with appropriate permissions
3. gitit installed on your system

## Creating a Bitbucket App Password

Bitbucket uses App Passwords for API authentication. To create one:

1. Log in to your Bitbucket account
2. Click on your profile icon in the bottom left corner
3. Select **Personal settings** from the menu
4. In the left sidebar, click on **App passwords**
5. Click the **Create app password** button
6. Give your app password a descriptive name (e.g., "gitit Access")
7. Select the following permissions:
   - **Repository**: Read
   - **Pull requests**: Read (optional)
8. Click **Create**
9. **Important**: Copy your app password immediately. You won't be able to see it again!

## Cloning a Private Repository

Once you have your app password, you can use it to clone private repositories:

```bash
gitit bitbucket:username/private-repo my-project --auth "your-app-password"
```

Replace:

- `username` with your Bitbucket username or workspace name
- `private-repo` with your private repository name
- `your-app-password` with the app password you created

## Using Environment Variables

For security and convenience, you can set your app password as an environment variable:

```bash
export GITIT_AUTH="your-app-password"
gitit bitbucket:username/private-repo my-project
```

Add this to your `.bashrc`, `.zshrc`, or equivalent shell configuration file for persistent access.

## Authentication Format for Bitbucket

Unlike GitHub and GitLab which use Bearer tokens, Bitbucket uses the app password as is. The token is added to the HTTP request headers:

```
Authorization: Bearer your-app-password
```

## Troubleshooting

### "Not found" or "404" errors

If you get "Not found" or "404" errors when trying to clone a private repository, check:

1. **Repository name is correct**: Double-check the repository name and username/workspace
2. **App password has proper permissions**: Ensure you've given it "Repository: Read" permissions
3. **Access to the repository**: Confirm that your Bitbucket account has access to the repository

### "Authentication failed" errors

If you get authentication errors:

1. **App password is correct**: Make sure you're using the correct app password
2. **App password is valid**: App passwords might expire; generate a new one if needed
3. **Format is correct**: Use the app password as-is without any additional prefixes

## Advanced Usage

### Specifying Branches

To clone a specific branch from a private Bitbucket repository:

```bash
gitit bitbucket:username/private-repo#develop my-project --auth "your-app-password"
```

### Cloning Subdirectories

To clone only a specific subdirectory from a private repository:

```bash
gitit bitbucket:username/private-repo/path/to/directory my-project --auth "your-app-password"
```

### Combined Branch and Subdirectory

You can specify both a branch and a subdirectory:

```bash
gitit bitbucket:username/private-repo/path/to/directory#develop my-project --auth "your-app-password"
```

## Configuration File

You can store your Bitbucket authentication in your `gitit.config.ts` file:

```typescript
// gitit.config.ts
export default {
  auth: process.env.GITIT_AUTH || 'your-app-password',
  // other options...
}
```

Just be careful not to commit this file to version control if it contains your actual app password.

## CI/CD Integration

For CI/CD pipelines, use secrets to store your app password:

```yaml
# GitHub Actions example
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Clone Bitbucket template
        run: gitit bitbucket:username/private-repo my-project
        env:
          GITIT_AUTH: ${{ secrets.BITBUCKET_APP_PASSWORD }}
```

## Best Practices

1. **Use environment variables**: Avoid putting your app password directly in commands
2. **Use specific branches or tags**: Reference specific versions for consistency
3. **Limit app password scope**: Only grant the minimum permissions needed
4. **Rotate app passwords**: Regularly update your app passwords for security
5. **Consider workspace permissions**: Be aware of team access controls in workspaces
