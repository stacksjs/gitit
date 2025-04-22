# Repository Support

Gitit provides comprehensive support for different types of repositories, including public and private repositories across various hosting platforms.

## Public Repositories

By default, Gitit works seamlessly with public repositories. You can clone from any public repository without authentication:

```bash
gitit template github:user/repo my-project
```

## Private Repositories

For private repositories, you'll need to provide authentication credentials. Gitit supports authentication via access tokens:

```bash
gitit template github:user/private-repo my-project --auth "your-access-token"
```

You can also set the authentication token in your environment variables to avoid typing it each time:

```bash
export GITIT_AUTH="your-access-token"
gitit template github:user/private-repo my-project
```

## Repository Providers

Gitit supports the following repository providers:

- **GitHub** (`github:` or `gh:`) - Full support for public and private repositories
- **GitLab** (`gitlab:`) - Full support for public and private repositories
- **Bitbucket** (`bitbucket:`) - Full support for public and private repositories
- **SourceHut** (`sourcehut:`) - Full support for public and private repositories
- **HTTP/HTTPS URLs** - Direct URL support for tarball archives

Each provider has specific implementation details for accessing repositories:

### GitHub

GitHub repositories use the GitHub API to download templates:

```bash
gitit template github:user/repo my-project
```

This will download the repository using the GitHub API URL: `https://api.github.com/repos/user/repo/tarball/main`

### GitLab

GitLab repositories are downloaded directly from the GitLab archive endpoint:

```bash
gitit template gitlab:user/repo my-project
```

This will download the repository from: `https://gitlab.com/user/repo/-/archive/main.tar.gz`

### Bitbucket

Bitbucket repositories use Bitbucket's archive endpoint:

```bash
gitit template bitbucket:user/repo my-project
```

This will download from: `https://bitbucket.org/user/repo/get/main.tar.gz`

### SourceHut

SourceHut repositories use SourceHut's archive endpoint:

```bash
gitit template sourcehut:user/repo my-project
```

This will download from: `https://git.sr.ht/~user/repo/archive/main.tar.gz`

### HTTP/HTTPS URLs

You can download templates directly from HTTP/HTTPS URLs to .tar.gz files:

```bash
gitit template https://example.com/template.tar.gz my-project
```

## Environment Variables

Provider behavior can be customized using environment variables:

- `GITIT_AUTH`: Default authentication token
- `GITIT_GITHUB_URL`: Custom GitHub API URL (useful for GitHub Enterprise)
- `GITIT_GITLAB_URL`: Custom GitLab URL

## Repository Features

### Subdirectories

You can clone specific subdirectories from a repository:

```bash
gitit template github:user/repo/path/to/directory my-project
```

This is handled by filtering the contents of the tarball during extraction, so only files from the specified subdirectory are extracted.

### Branches and Tags

You can specify branches or tags to clone from:

```bash
# Clone from a branch
gitit template github:user/repo#dev my-project

# Clone from a tag
gitit template github:user/repo#v1.0.0 my-project
```

The branch or tag name is included in the API request to fetch the specific version.

## Best Practices

When working with repositories as templates:

1. **Use specific tags or commits** for production templates to ensure consistency
2. **Store authentication tokens securely** using environment variables
3. **Create dedicated template repositories** with clear documentation and examples
4. **Structure your template repositories** with subdirectories if you want to offer multiple template variations
5. **Consider using a custom registry** for enterprise environments with internal repositories
