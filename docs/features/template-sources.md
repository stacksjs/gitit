# Template Sources

Gitit supports cloning templates from various sources, making it easy to start your projects from different code hosting platforms.

## Supported Providers

### GitHub

GitHub is the most popular source for templates. You can clone from GitHub using the following syntax:

```bash
gitit template github:user/repo my-project
# or the shorthand
gitit template gh:user/repo my-project
```

This uses the GitHub API to download the repository tarball.

### GitLab

For templates hosted on GitLab:

```bash
gitit template gitlab:user/repo my-project
```

This downloads directly from GitLab's archive endpoint.

### Bitbucket

For templates hosted on Bitbucket:

```bash
gitit template bitbucket:user/repo my-project
```

This uses Bitbucket's archive API to get the template.

### SourceHut

For templates hosted on SourceHut:

```bash
gitit template sourcehut:user/repo my-project
```

This downloads from SourceHut's archive endpoint.

### Direct URLs

You can also use direct HTTP/HTTPS URLs to download templates:

```bash
gitit template https://example.com/template.tar.gz my-project
```

This will download the tarball directly from the specified URL.

## Advanced Template References

### Specifying Branches

You can specify a particular branch using the `#` symbol:

```bash
gitit template github:user/repo#dev my-project
```

This will clone the template from the `dev` branch. If not specified, Gitit defaults to the `main` branch.

### Specifying Subdirectories

To clone from a specific subdirectory within a repository:

```bash
gitit template github:user/repo/packages/ui my-project
```

This will clone only the contents of the `packages/ui` directory. The subdirectory filtering is done during the extraction process.

### Combining Branch and Subdirectory

You can also combine both features:

```bash
gitit template github:user/repo/packages/ui#dev my-project
```

This will clone the contents of the `packages/ui` directory from the `dev` branch.

## How Template Resolution Works

When you use Gitit with a template source, here's what happens:

1. Gitit parses the input to determine the provider (github, gitlab, etc.)
2. If a provider is explicitly specified (e.g., `github:`), that provider is used
3. If no provider is specified, Gitit defaults to GitHub
4. The repository reference is parsed to extract the repository name, subdirectory, and branch/tag
5. Gitit constructs the appropriate URL to download the template tarball
6. The tarball is downloaded to a local cache directory
7. If a subdirectory is specified, only files from that directory are extracted
8. The template is extracted to the target directory

## Default Behavior

- If no branch is specified, Gitit uses `main` as the default branch
- If no target directory is specified, Gitit uses a directory named after the template
- If no provider is specified, Gitit assumes GitHub

## Environment Variables

You can customize template source behavior using environment variables:

- `GITIT_GITHUB_URL`: Custom GitHub API URL for GitHub Enterprise
- `GITIT_GITLAB_URL`: Custom GitLab URL for self-hosted GitLab instances
- `GITIT_REGISTRY`: URL of a custom template registry
- `GITIT_AUTH`: Default authentication token for private repositories
